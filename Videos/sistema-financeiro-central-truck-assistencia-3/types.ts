
import React from 'react';

export interface ContaPagar {
  id: number;
  descricao: string;
  valor_com_nota: number;
  valor_sem_nota: number;
  categoria: string;
  vencimento: string;
  status: 'PENDENTE' | 'PAGO';
}

export interface FluxoCaixa {
  id: number;
  data_movimento: string;
  descricao: string;
  categoria: string;
  tipo_movimento: 'ENTRADA' | 'SAÍDA';
  valor: number;
}

export interface FaturamentoComNF {
  id: number;
  data_faturamento: string;
  cliente: string;
  nota_servico?: string;
  nota_peca?: string;
  valor_total: number;
  parcelas: number;
  condicoes_pagamento?: string;
}

export interface FaturamentoSemNF {
  id: number;
  data_faturamento: string;
  numero_orcamento?: string;
  valor_total: number;
  condicao_pagamento?: string;
  categoria: string;
}

export type WindowInstance = {
  id: string;
  title: string;
  component: React.ReactNode;
  icon: React.FC<{ className?: string }>;
};

export type AppData = {
  contasPagar: ContaPagar[];
  fluxoCaixa: FluxoCaixa[];
  faturamentoComNF: FaturamentoComNF[];
  faturamentoSemNF: FaturamentoSemNF[];
};

export interface Usuario {
  id: number;
  nome: string;
  password?: string; // Only for creation/update, not for fetching
}
