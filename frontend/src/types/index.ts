// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  username: string
  email?: string | null
  full_name: string
  role: 'ADMIN' | 'PCP' | 'VIEWER'
  is_active: boolean
  force_password_change: boolean
  failed_login_attempts: number
  blocked_until?: string | null
  last_failed_login_at?: string | null
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
  force_password_change: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface CreateUserPayload {
  username: string
  email: string | null
  full_name: string
  password: string
  role: 'ADMIN' | 'PCP' | 'VIEWER'
}

export interface UpdateUserPayload {
  username?: string
  email?: string | null
  full_name?: string
  role?: 'ADMIN' | 'PCP' | 'VIEWER'
  is_active?: boolean
}

export interface ChangePasswordRequest {
  password: string
}

export interface FirstLoginChangePasswordRequest {
  current_password: string
  new_password: string
}

// ─── ZPM ─────────────────────────────────────────────────────────────────────

export interface ZpmRecord {
  id: number
  filial: string
  prod: string
  mesref: string
  linha: string
  desc: string
  pmpmes: number
  d01: number
  d02: number
  d03: number
  d04: number
  d05: number
  d06: number
  d07: number
  d08: number
  d09: number
  d10: number
  d11: number
  d12: number
  d13: number
  d14: number
  d15: number
  d16: number
  d17: number
  d18: number
  d19: number
  d20: number
  d21: number
  d22: number
  d23: number
  d24: number
  d25: number
  d26: number
  d27: number
  d28: number
  d29: number
  d30: number
  d31: number
  totpg: number
  dtimpt: string | null
  usrimpt: string
  origem: string
  updated_at: string
}

export type ZpmCreate = Omit<ZpmRecord, 'id' | 'totpg' | 'dtimpt' | 'usrimpt' | 'origem' | 'updated_at'>

export type ZpmUpdate = Partial<Omit<ZpmRecord, 'id' | 'filial' | 'prod' | 'mesref' | 'totpg' | 'dtimpt' | 'usrimpt' | 'origem' | 'updated_at'>>

export interface ZpmFilter {
  filial?: string
  mesref?: string
  search?: string
}

// ─── Import ───────────────────────────────────────────────────────────────────

export const IMPORT_SKIP = 1
export const IMPORT_UPDATE = 2
export const IMPORT_FORCE = 3

export type ImportMode = 1 | 2 | 3

export interface ImportDetailItem {
  row: number
  prod: string
  desc: string
  status: 'ok' | 'skip' | 'error'
  message: string
}

export interface ImportLog {
  id: number
  mesref: string
  filename: string
  mode: ImportMode
  total: number
  ok: number
  skip: number
  error: number
  created_at: string
  username: string
  details?: ImportDetailItem[] | null
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ─── S&OP ─────────────────────────────────────────────────────────────────────

export interface SoppKpis {
  qtde_carteira: number
  valor_carteira: number
  estoque_disponivel: number
  fat_mes_atual: number
  qtde_fat_mes: number
  fat_devol_mes: number
  qtde_devol_mes: number
  fat_bonif_mes: number
  qtde_bonif_mes: number
  prod_mes_atual: number
}

export interface SoppDashboard {
  kpis: SoppKpis
  fat_mensal: { mes: string; liquido: number; devol: number }[]
  carteira_por_linha: { linha: string; valor: number; qtde: number }[]
  faturamento_por_familia: { familia: string; valor: number; pct: number }[]
  top_clientes_faturamento: { cliente: string; valor: number; caixas: number; pct: number }[]
  producao_diaria: { data: string; qtde: number }[]
  estoque_top10: { cod_prd: string; desc_prd: string; disp: number; reserva: number }[]
  devolucoes_por_dia: { data: string; faturamento_bruto_caixas: number; devolucao_caixas: number; pct_dev: number; faturamento_liquido_caixas: number }[]
}

export interface DevolucaoStats {
  kpis: { qtde_notas: number; qtde_itens: number; valor_total: number }
  por_periodo: { mes: string; valor: number; qtde: number }[]
  por_supervisor: { supervisor: string; valor: number; qtde: number }[]
  por_uf: { uf: string; valor: number }[]
  por_linha: { linha: string; valor: number; qtde: number }[]
}

// ─── Devoluções dedicadas ─────────────────────────────────────────────────────

export interface DevolucaoData {
  kpis: { total_nfs: number; total_qtde: number; valor_total: number }
  por_area: { area: string; valor: number; qtde: number; cnt: number }[]
  por_motivo: { motivo: string; valor: number; qtde: number; cnt: number }[]
  por_linha: { linha: string; valor: number; qtde: number }[]
  por_supervisor: { supervisor: string; valor: number; qtde: number; cnt: number }[]
  por_uf: { uf: string; valor: number; cnt: number }[]
  por_periodo: { mes: string; valor: number; qtde: number; cnt: number }[]
}

export interface BonificacaoData {
  kpis: { total_nfs: number; total_qtde: number; valor_total: number; vl_bonific: number; vl_verba: number }
  por_subtipo: { subtipo: string; valor: number; qtde: number; cnt: number }[]
  por_linha: { linha: string; valor: number; qtde: number }[]
  por_supervisor: { supervisor: string; valor: number; qtde: number; cnt: number }[]
  por_uf: { uf: string; valor: number; cnt: number }[]
  por_periodo: { mes: string; valor: number; qtde: number; cnt: number }[]
  por_cliente: { cliente: string; valor: number; qtde: number }[]
}

export interface SoppChartByFamilia {
  familia: string
  valor: number
}

export interface SoppChartByVendedor {
  vendedor: string
  valor: number
}

export interface PedidosChartsKpis {
  total_pedidos: number
  total_qtde: number
  total_valor: number
  preco_medio: number
}

export interface PedidosCharts {
  kpis: PedidosChartsKpis
  por_linha: { linha: string; qtde: number; valor: number }[]
  por_formato: { formato: string; qtde: number; valor: number }[]
}

export interface ProducaoFilial {
  filial: string
  label: string
  total_qtde: number
  dias_produtivos: number
  total_movtos: number
  media_dia: number
}

export interface ProducaoCharts {
  kpis: {
    total_qtde: number
    dias_produtivos: number
    media_dia: number
    total_movtos: number
    top_produto: { cod_prd: string; produto: string; qtde: number } | null
  }
  por_dia: { data: string; qtde: number }[]
  por_linha: { linha: string; qtde: number }[]
  por_filial: ProducaoFilial[]
}

export interface ForecastResponse {
  items: SkuForecast[]
  fat_real: Record<string, ForecastRealItem>
}

export interface ForecastRealItem {
  cod_prd: string
  jan: number
  fev: number
  mar: number
  abr: number
  mai: number
  jun: number
  jul: number
  ago: number
  set_m: number
  out_m: number
  nov: number
  dez: number
  total: number
}

export interface ForecastSummaryItem {
  linha: string
  forecast: number
  real: number
  atingimento: number
  fc_mes: Record<string, number>
  real_mes: Record<string, number>
}

export interface EstoqueFilial {
  filial: string
  label: string
  atu: number
  reserva: number
  disp: number
  qaclass: number
  produtos: number
  zerados: number
}

export interface EstoqueKpis {
  total_disp: number
  total_atu: number
  total_reserva: number
  total_qaclass: number
  skus_total: number
  skus_ativos: number
  skus_zerados: number
}

export interface EstoqueResponse {
  items: EstoquePa[]
  por_linha: { linha: string; disp: number; reserva: number; atu: number }[]
  por_filial: EstoqueFilial[]
  kpis: EstoqueKpis
}

export interface FaturamentoCharts {
  por_mes: { mes: string; bruto: number; liquido: number }[]
  por_linha: { linha: string; valor: number }[]
  por_vendedor: SoppChartByVendedor[]
}

export interface PvAberto {
  sk_pedido: string
  num_pv: string | null
  cod_prd: string
  desc_prd: string
  fam: string
  qtde: number
  vl_bruto: number
  cliente: string
  vend: string | null
  nome_vend: string | null
  sup: string | null
  emissao: string | null
  dt_agenda: string | null
  dt_entrega: string | null
}

export interface MovProducao {
  sk_movto: string
  op: string | null
  lote: string | null
  cod_prd: string
  produto: string
  tipo: string
  operacao: string | null
  qtde: number
  armazem: string | null
  emissao: string | null
  hra: string | null
  tb_filial: string | null
}

export interface SkuForecast {
  sk_forecast: string
  cod_prd: string
  linha: string | null
  desc_prd: string
  grp_prd: string | null
  cod_fam: string | null
  fam: string
  marca: string | null
  tipo: string | null
  '%_abc': number | null
  jan: number; fev: number; mar: number; abr: number; mai: number; jun: number
  jul: number; ago: number; set_m: number; out: number; nov: number; dez: number
  total: number
}

export interface EstoquePa {
  sk_estoque: string
  cod_prd: string
  desc_prd: string
  familia: string | null
  tb_empresa: string
  empresa: string | null
  local: string
  qtde_atu: number
  qtde_reserva: number
  qtde_emp: number
  qtde_qaclass: number
  qtde_empsai: number
  qtde_empprj: number
  qtde_tnp: number
  qtde_emppre: number
  qtde_disp: number
}

export interface Faturamento {
  sk_fat: string
  filial: string | null
  tp: string | null
  familia: string | null
  cod_prd: string
  descricao: string
  nf: string | null
  serie: string | null
  emissao: string | null
  quantidade: number
  cliente: string | null
  municipio: string | null
  uf: string | null
  nome_vend: string | null
  supervisor: string | null
  vl_bruto: number
  vl_liquido: number
  perc_com: number | null
  com: number | null
}

export interface SoppFilters {
  familias_pv: { code: string; label: string }[]
  linhas_pv: string[]
  formatos_pv: string[]
  vendedores_pv: string[]
  tipos_producao: string[]
  familias_forecast: string[]
  empresas_estoque: { cod: string; nome: string }[]
  locais_estoque: string[]
  familias_estoque: string[]
  familias_faturamento: string[]
  vendedores_faturamento: string[]
  ufs: string[]
}

// ─── Prog. Embarque ───────────────────────────────────────────────────────────

export interface EmbarqueDia {
  data: string
  demanda: number
  pmp: number
  saldo: number
}

export interface EmbarqueItem {
  cod_prd: string
  desc_prd: string
  linha: string
  estoque_disp: number
  demanda_total: number
  dias: EmbarqueDia[]
  status: 'RUPTURA' | 'ALERTA' | 'OK'
}

export interface EmbarqueKpis {
  total_prds: number
  em_ruptura: number
  em_alerta: number
  demanda_total: number
}

export interface EmbarqueResponse {
  datas: string[]
  items: EmbarqueItem[]
  kpis: EmbarqueKpis
}

// ─── PMP vs Real ──────────────────────────────────────────────────────────────

export interface PmpRealFilters {
  meses: string[]
  linhas: string[]
}

export interface PmpRealItem {
  cod_prd: string
  desc: string
  linha: string
  pmpmes: number
  programado: number
  realizado: number
  atingimento: number
  prog: Record<string, number>  // d01..d31
  real: Record<string, number>  // d01..d31
}

export interface PmpRealResponse {
  mesref: string
  kpis: { programado: number; realizado: number; atingimento: number }
  items: PmpRealItem[]
}

// ─── feriado ────────────────────────────────────────────────────────

export interface Feriado {
  id: number
  data_feriado: string
  descricao: string
  tipo: string
  is_active: boolean
  created_at: string
  created_by?: string | null
  updated_at?: string | null
  updated_by?: string | null
}

export interface CreateFeriadoPayload {
  data_feriado: string
  descricao: string
  tipo: string
}

export interface UpdateFeriadoPayload {
  data_feriado?: string
  descricao?: string
  tipo?: string
  is_active?: boolean
}
