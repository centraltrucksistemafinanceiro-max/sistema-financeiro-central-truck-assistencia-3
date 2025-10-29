import { createClient } from '@supabase/supabase-js';
import { ContaPagar, FluxoCaixa, FaturamentoComNF, FaturamentoSemNF, Usuario } from '../types';
import { PAGE_SIZE, parseCurrency } from '../constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

interface QueryParams {
    page: number;
    searchTerm: string;
    startDate: string;
    endDate: string;
    category?: string;
}

interface PrintQueryParams {
    searchTerm: string;
    startDate: string;
    endDate: string;
    category?: string;
}

// --- User Management ---
export const getUserByCredentials = async (nome: string, senha: string): Promise<Usuario | null> => {
    const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('nome', nome)
        .eq('senha', senha)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row was not found"
        throw error;
    }

    return data;
};

export const getAllUsers = async (): Promise<Usuario[]> => {
    const { data, error } = await supabase.from('usuarios_sistema').select('id, nome').order('nome');
    if (error) throw error;
    return data;
};

export const addUser = async (newUser: Pick<Usuario, 'nome' | 'password'>) => {
    const { data, error } = await supabase.from('usuarios_sistema').insert({
        nome: newUser.nome,
        senha: newUser.password
    }).select();
    if (error) throw error;
    return data[0];
};

export const updateUserPassword = async (id: number, senha: string) => {
    const { data, error } = await supabase.from('usuarios_sistema').update({ senha }).eq('id', id).select();
    if (error) throw error;
    return data[0];
};

export const deleteUser = async (id: number) => {
    // FIX: Removed .select() from delete operation, as it's not needed and can cause issues if RLS prevents returning data.
    const { error } = await supabase.from('usuarios_sistema').delete().eq('id', id);
    if (error) throw error;
};

// --- Contas a Pagar ---
export const getContasPagar = async ({ page, searchTerm, startDate, endDate, category }: QueryParams) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('contas_pagar').select('*', { count: 'exact' });
    if (searchTerm) query = query.ilike('descricao', `%${searchTerm}%`);
    if (startDate) query = query.gte('vencimento', startDate);
    if (endDate) query = query.lte('vencimento', endDate);
    if (category) query = query.eq('categoria', category);

    const { data, error, count } = await query.order('vencimento', { ascending: true }).range(from, to);
    if (error) throw error;
    return { data, count };
};

export const getPrintContasPagar = async ({ searchTerm, startDate, endDate, category }: PrintQueryParams) => {
    let query = supabase.from('contas_pagar').select('*');
    if (searchTerm) query = query.ilike('descricao', `%${searchTerm}%`);
    if (startDate) query = query.gte('vencimento', startDate);
    if (endDate) query = query.lte('vencimento', endDate);
    if (category) query = query.eq('categoria', category);

    const { data, error } = await query.order('vencimento', { ascending: true });
    if (error) throw error;
    return data;
};

export const getContasPagarTotal = async ({ searchTerm, startDate, endDate, category }: PrintQueryParams) => {
    let query = supabase.from('contas_pagar').select('valor_com_nota, valor_sem_nota');

    if (searchTerm) query = query.ilike('descricao', `%${searchTerm}%`);
    if (startDate) query = query.gte('vencimento', startDate);
    if (endDate) query = query.lte('vencimento', endDate);
    if (category) query = query.eq('categoria', category);

    const { data, error } = await query;
    if (error) throw error;
    
    return data.reduce((sum, item) => sum + parseCurrency(item.valor_com_nota) + parseCurrency(item.valor_sem_nota), 0);
};

export const addContaPagar = async (conta: Omit<ContaPagar, 'id'>) => {
  const { data, error } = await supabase.from('contas_pagar').insert([conta]).select();
  if (error) throw error;
  return data[0];
};

export const updateContaPagar = async (id: number, updates: Partial<Omit<ContaPagar, 'id'>>) => {
  const { data, error } = await supabase.from('contas_pagar').update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteContaPagar = async (id: number) => {
  const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
  if (error) throw error;
};

// --- Fluxo de Caixa ---
export const getFluxoCaixa = async ({ page, searchTerm, startDate, endDate }: QueryParams) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('fluxo_caixa').select('*', { count: 'exact' });
    if (searchTerm) query = query.ilike('descricao', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_movimento', startDate);
    if (endDate) query = query.lte('data_movimento', endDate);
    
    const { data, error, count } = await query.order('data_movimento', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data, count };
};

export const getPrintFluxoCaixa = async ({ searchTerm, startDate, endDate }: PrintQueryParams) => {
    let query = supabase.from('fluxo_caixa').select('*');
    if (searchTerm) query = query.ilike('descricao', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_movimento', startDate);
    if (endDate) query = query.lte('data_movimento', endDate);
    
    const { data, error } = await query.order('data_movimento', { ascending: false });
    if (error) throw error;
    return data;
};

export const getFluxoCaixaTotal = async ({ searchTerm, startDate, endDate }: PrintQueryParams) => {
    let query = supabase.from('fluxo_caixa').select('tipo_movimento, valor');
    if (searchTerm) query = query.ilike('descricao', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_movimento', startDate);
    if (endDate) query = query.lte('data_movimento', endDate);

    const { data, error } = await query;
    if (error) throw error;

    return data.reduce((sum, item) => sum + (item.tipo_movimento === 'ENTRADA' ? parseCurrency(item.valor) : -parseCurrency(item.valor)), 0);
};

export const addFluxoCaixa = async (fluxo: Omit<FluxoCaixa, 'id'>) => {
  const { data, error } = await supabase.from('fluxo_caixa').insert([fluxo]).select();
  if (error) throw error;
  return data[0];
};

export const updateFluxoCaixa = async (id: number, updates: Partial<Omit<FluxoCaixa, 'id'>>) => {
    const { data, error } = await supabase.from('fluxo_caixa').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
};

export const deleteFluxoCaixa = async (id: number) => {
  const { error } = await supabase.from('fluxo_caixa').delete().eq('id', id);
  if (error) throw error;
};

// --- Faturamento com NF ---
export const getFaturamentoComNF = async ({ page, searchTerm, startDate, endDate }: QueryParams) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    
    let query = supabase.from('faturamento_com_nf').select('*', { count: 'exact' });
    if (searchTerm) query = query.ilike('cliente', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_faturamento', startDate);
    if (endDate) query = query.lte('data_faturamento', endDate);

    const { data, error, count } = await query.order('data_faturamento', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data, count };
};

export const getPrintFaturamentoComNF = async ({ searchTerm, startDate, endDate }: PrintQueryParams) => {
    let query = supabase.from('faturamento_com_nf').select('*');
    if (searchTerm) query = query.ilike('cliente', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_faturamento', startDate);
    if (endDate) query = query.lte('data_faturamento', endDate);

    const { data, error } = await query.order('data_faturamento', { ascending: false });
    if (error) throw error;
    return data;
};

export const getFaturamentoComNFTotal = async ({ searchTerm, startDate, endDate }: PrintQueryParams) => {
    let query = supabase.from('faturamento_com_nf').select('valor_total');
    if (searchTerm) query = query.ilike('cliente', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_faturamento', startDate);
    if (endDate) query = query.lte('data_faturamento', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data.reduce((sum, item) => sum + parseCurrency(item.valor_total), 0);
};

export const addFaturamentoComNF = async (faturamento: Omit<FaturamentoComNF, 'id'>) => {
  const { data, error } = await supabase.from('faturamento_com_nf').insert([faturamento]).select();
  if (error) throw error;
  return data[0];
};

export const updateFaturamentoComNF = async (id: number, updates: Partial<Omit<FaturamentoComNF, 'id'>>) => {
    const { data, error } = await supabase.from('faturamento_com_nf').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
};

export const deleteFaturamentoComNF = async (id: number) => {
  const { error } = await supabase.from('faturamento_com_nf').delete().eq('id', id);
  if (error) throw error;
};

// --- Faturamento sem NF ---
export const getFaturamentoSemNF = async ({ page, searchTerm, startDate, endDate }: QueryParams) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('faturamento_sem_nf').select('*', { count: 'exact' });
    if (searchTerm) query = query.ilike('numero_orcamento', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_faturamento', startDate);
    if (endDate) query = query.lte('data_faturamento', endDate);

    const { data, error, count } = await query.order('data_faturamento', { ascending: false }).range(from, to);
    if (error) throw error;
    return { data, count };
};

export const getPrintFaturamentoSemNF = async ({ searchTerm, startDate, endDate }: PrintQueryParams) => {
    let query = supabase.from('faturamento_sem_nf').select('*');
    if (searchTerm) query = query.ilike('numero_orcamento', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_faturamento', startDate);
    if (endDate) query = query.lte('data_faturamento', endDate);

    const { data, error } = await query.order('data_faturamento', { ascending: false });
    if (error) throw error;
    return data;
};

export const getFaturamentoSemNFTotal = async ({ searchTerm, startDate, endDate }: PrintQueryParams) => {
    let query = supabase.from('faturamento_sem_nf').select('valor_total');
    if (searchTerm) query = query.ilike('numero_orcamento', `%${searchTerm}%`);
    if (startDate) query = query.gte('data_faturamento', startDate);
    if (endDate) query = query.lte('data_faturamento', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data.reduce((sum, item) => sum + parseCurrency(item.valor_total), 0);
};

export const addFaturamentoSemNF = async (faturamento: Omit<FaturamentoSemNF, 'id'>) => {
  const { data, error } = await supabase.from('faturamento_sem_nf').insert([faturamento]).select();
  if (error) throw error;
  return data[0];
};

export const updateFaturamentoSemNF = async (id: number, updates: Partial<Omit<FaturamentoSemNF, 'id'>>) => {
    const { data, error } = await supabase.from('faturamento_sem_nf').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
};

export const deleteFaturamentoSemNF = async (id: number) => {
  const { error } = await supabase.from('faturamento_sem_nf').delete().eq('id', id);
  if (error) throw error;
};

// Global fetch for dashboard
const fetchAllFromTable = async <T>(tableName: string): Promise<T[]> => {
    const BATCH_SIZE = 1000; // Default limit in Supabase
    let allRecords: T[] = [];
    let from = 0;
    
    while (true) {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(from, from + BATCH_SIZE - 1);

        if (error) {
            console.error(`Error fetching from ${tableName}:`, error);
            throw error;
        }

        if (data) {
            allRecords.push(...data as any[]);
        }

        if (!data || data.length < BATCH_SIZE) {
            break; // Exit loop if we've fetched all records
        }

        from += BATCH_SIZE;
    }
    return allRecords;
};

export const getAllContasPagar = async (): Promise<ContaPagar[]> => {
    return await fetchAllFromTable<ContaPagar>('contas_pagar');
};
export const getAllFluxoCaixa = async (): Promise<FluxoCaixa[]> => {
    return await fetchAllFromTable<FluxoCaixa>('fluxo_caixa');
};
export const getAllFaturamentoComNF = async (): Promise<FaturamentoComNF[]> => {
    return await fetchAllFromTable<FaturamentoComNF>('faturamento_com_nf');
};
export const getAllFaturamentoSemNF = async (): Promise<FaturamentoSemNF[]> => {
    return await fetchAllFromTable<FaturamentoSemNF>('faturamento_sem_nf');
};
