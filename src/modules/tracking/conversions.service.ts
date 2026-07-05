import type { ConversionStatus } from "@prisma/client";
import { conversionsRepository } from "./conversions.repository";
import { projectsService } from "@/modules/projects/projects.service";

// ============================================================
// MOTOR DE ATRIBUIÇÃO
//
// Toda conversão é registrada. A atribuição acontece em camadas:
//   1. visitor_id → clique encontrado → atribuição completa
//   2. sem clique, mas com UTMs no metadata → origem declarada
//   3. nada → "não atribuída" (métrica honesta, visível no relatório)
//
// Deduplicação: o mesmo external_id (ID do pedido) nunca gera
// duas conversões no mesmo projeto. Eventos repetidos apenas
// ATUALIZAM o status (ex: pedido pago → depois reembolsado).
// ============================================================

export type ProcessConversionInput = {
  externalId: string;
  eventName: string;
  value: number | null;
  currency: string;
  status: ConversionStatus;
  visitorId: string | null;
  convertedAt: Date;
  metadata: Record<string, unknown>;
};

export const conversionsService = {
  async processConversion(projectId: string, input: ProcessConversionInput) {
    // --- Deduplicação / reconciliação de status ---
    const existing = await conversionsRepository.findByExternalId(
      projectId,
      input.externalId
    );

    if (existing) {
      if (existing.status !== input.status) {
        // Pedido mudou de estado (ex: APPROVED → REFUNDED). Receita fica verdadeira.
        await conversionsRepository.updateStatus(existing.id, input.status);
        return { action: "status_updated" as const, conversionId: existing.id };
      }
      return { action: "duplicate_ignored" as const, conversionId: existing.id };
    }

    // --- Atribuição ---
    let clickId: bigint | null = null;
    if (input.visitorId) {
      const click = await conversionsRepository.findLatestClickByVisitor(
        projectId,
        input.visitorId
      );
      clickId = click?.id ?? null;
    }

    const conversion = await conversionsRepository.create({
      projectId,
      externalId: input.externalId,
      clickId,
      visitorId: input.visitorId,
      eventName: input.eventName,
      value: input.value,
      currency: input.currency,
      status: input.status,
      metadata: input.metadata as never,
      convertedAt: input.convertedAt,
    });

    return {
      action: "created" as const,
      conversionId: conversion.id,
      attributed: clickId !== null,
    };
  },

  /** Listagem para o dashboard (com verificação de propriedade). */
  async listConversions(userId: string, projectId: string) {
    await projectsService.getProject(userId, projectId);
    return conversionsRepository.listByProject(projectId);
  },
};
