import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, Eye } from 'lucide-react'
import { cn, calcTotpg } from '../../lib/utils'
import type { ZpmRecord } from '../../types'

const schema = z.object({
  filial: z.string().min(1, 'Filial obrigatória').max(2),
  prod: z.string().min(1, 'Produto obrigatório').max(20),
  mesref: z.string().length(6, 'Formato: AAAAMM').regex(/^\d{6}$/, 'Somente números'),
  linha: z.string().max(20).default(''),
  desc: z.string().max(60).default(''),
  pmpmes: z.coerce.number().min(0).default(0),
  d01: z.coerce.number().min(0).default(0),
  d02: z.coerce.number().min(0).default(0),
  d03: z.coerce.number().min(0).default(0),
  d04: z.coerce.number().min(0).default(0),
  d05: z.coerce.number().min(0).default(0),
  d06: z.coerce.number().min(0).default(0),
  d07: z.coerce.number().min(0).default(0),
  d08: z.coerce.number().min(0).default(0),
  d09: z.coerce.number().min(0).default(0),
  d10: z.coerce.number().min(0).default(0),
  d11: z.coerce.number().min(0).default(0),
  d12: z.coerce.number().min(0).default(0),
  d13: z.coerce.number().min(0).default(0),
  d14: z.coerce.number().min(0).default(0),
  d15: z.coerce.number().min(0).default(0),
  d16: z.coerce.number().min(0).default(0),
  d17: z.coerce.number().min(0).default(0),
  d18: z.coerce.number().min(0).default(0),
  d19: z.coerce.number().min(0).default(0),
  d20: z.coerce.number().min(0).default(0),
  d21: z.coerce.number().min(0).default(0),
  d22: z.coerce.number().min(0).default(0),
  d23: z.coerce.number().min(0).default(0),
  d24: z.coerce.number().min(0).default(0),
  d25: z.coerce.number().min(0).default(0),
  d26: z.coerce.number().min(0).default(0),
  d27: z.coerce.number().min(0).default(0),
  d28: z.coerce.number().min(0).default(0),
  d29: z.coerce.number().min(0).default(0),
  d30: z.coerce.number().min(0).default(0),
  d31: z.coerce.number().min(0).default(0),
})

type FormValues = z.infer<typeof schema>

interface PmpFormProps {
  mode: 'create' | 'edit' | 'view'
  record?: ZpmRecord | null
  loading?: boolean
  onSubmit: (data: FormValues) => void
  onClose: () => void
  defaultMesref?: string
  defaultFilial?: string
}

const DAYS = Array.from({ length: 31 }, (_, i) => `d${String(i + 1).padStart(2, '0')}`) as Array<keyof FormValues>

export default function PmpForm({
  mode,
  record,
  loading,
  onSubmit,
  onClose,
  defaultMesref,
  defaultFilial,
}: PmpFormProps) {
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const isCreate = mode === 'create'

  const defaultValues = useMemo<Partial<FormValues>>(() => {
    if (record) {
      return {
        filial: record.filial,
        prod: record.prod,
        mesref: record.mesref,
        linha: record.linha,
        desc: record.desc,
        pmpmes: record.pmpmes,
        d01: record.d01, d02: record.d02, d03: record.d03, d04: record.d04,
        d05: record.d05, d06: record.d06, d07: record.d07, d08: record.d08,
        d09: record.d09, d10: record.d10, d11: record.d11, d12: record.d12,
        d13: record.d13, d14: record.d14, d15: record.d15, d16: record.d16,
        d17: record.d17, d18: record.d18, d19: record.d19, d20: record.d20,
        d21: record.d21, d22: record.d22, d23: record.d23, d24: record.d24,
        d25: record.d25, d26: record.d26, d27: record.d27, d28: record.d28,
        d29: record.d29, d30: record.d30, d31: record.d31,
      }
    }
    return {
      filial: defaultFilial || '',
      mesref: defaultMesref || '',
      prod: '', linha: '', desc: '', pmpmes: 0,
      d01: 0, d02: 0, d03: 0, d04: 0, d05: 0, d06: 0, d07: 0,
      d08: 0, d09: 0, d10: 0, d11: 0, d12: 0, d13: 0, d14: 0,
      d15: 0, d16: 0, d17: 0, d18: 0, d19: 0, d20: 0, d21: 0,
      d22: 0, d23: 0, d24: 0, d25: 0, d26: 0, d27: 0, d28: 0,
      d29: 0, d30: 0, d31: 0,
    }
  }, [record, defaultMesref, defaultFilial])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [record, reset, defaultValues])

  // Watch all day fields for live total
  const watchedValues = watch()
  const liveTotal = useMemo(() => calcTotpg(watchedValues as unknown as Record<string, number>), [watchedValues])

  const titles = {
    create: 'Novo Registro',
    edit: 'Editar Registro',
    view: 'Visualizar Registro',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dialog-overlay" onClick={onClose} />

      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col dialog-content">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: isView ? '#32373c' : '#D92214' }}
            >
              {isView ? <Eye size={18} className="text-white" /> : <Save size={18} className="text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{titles[mode]}</h2>
              {record && (
                <p className="text-xs text-gray-500">
                  {record.prod} · {record.mesref}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="pmp-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Section: Identificação */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-300 inline-block" />
                Identificação
                <span className="flex-1 h-px bg-gray-100 inline-block" />
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="label">Filial <span className="text-red-500">*</span></label>
                  <input
                    {...register('filial')}
                    disabled={isView || isEdit}
                    maxLength={2}
                    className={cn('input-field', errors.filial && 'border-red-400', (isView || isEdit) && 'bg-gray-50 cursor-not-allowed')}
                    placeholder="01"
                  />
                  {errors.filial && <p className="mt-1 text-xs text-red-500">{errors.filial.message}</p>}
                </div>

                <div>
                  <label className="label">Mês Referência <span className="text-red-500">*</span></label>
                  <input
                    {...register('mesref')}
                    disabled={isView || isEdit}
                    maxLength={6}
                    className={cn('input-field', errors.mesref && 'border-red-400', (isView || isEdit) && 'bg-gray-50 cursor-not-allowed')}
                    placeholder="202603"
                  />
                  {errors.mesref && <p className="mt-1 text-xs text-red-500">{errors.mesref.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="label">Produto <span className="text-red-500">*</span></label>
                  <input
                    {...register('prod')}
                    disabled={isView || isEdit}
                    maxLength={20}
                    className={cn('input-field', errors.prod && 'border-red-400', (isView || isEdit) && 'bg-gray-50 cursor-not-allowed')}
                    placeholder="Código do produto"
                  />
                  {errors.prod && <p className="mt-1 text-xs text-red-500">{errors.prod.message}</p>}
                </div>

                <div className="col-span-2 sm:col-span-3">
                  <label className="label">Descrição</label>
                  <input
                    {...register('desc')}
                    disabled={isView}
                    maxLength={60}
                    className={cn('input-field', isView && 'bg-gray-50 cursor-not-allowed')}
                    placeholder="Descrição do produto"
                  />
                </div>

                <div>
                  <label className="label">Linha</label>
                  <input
                    {...register('linha')}
                    disabled={isView}
                    maxLength={20}
                    className={cn('input-field', isView && 'bg-gray-50 cursor-not-allowed')}
                    placeholder="Linha produção"
                  />
                </div>

                <div>
                  <label className="label">PMP do Mês</label>
                  <input
                    {...register('pmpmes')}
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isView}
                    className={cn('input-field', isView && 'bg-gray-50 cursor-not-allowed')}
                    placeholder="0"
                  />
                </div>

                {isView && record && (
                  <>
                    <div>
                      <label className="label">Origem</label>
                      <div className="mt-1">
                        <span className={cn('badge', record.origem === 'I' ? 'badge-blue' : 'badge-green')}>
                          {record.origem === 'I' ? 'Importado' : 'Manual'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Usuário Import.</label>
                      <p className="text-sm text-gray-700 font-medium mt-1">{record.usrimpt || '-'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section: Programação Diária */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-300 inline-block" />
                Programação Diária
                <span className="flex-1 h-px bg-gray-100 inline-block" />
              </h3>

              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                  const dayNum = day.slice(1)
                  return (
                    <div key={day}>
                      <label className="block text-center text-xs font-bold text-gray-500 mb-1">
                        {dayNum}
                      </label>
                      <input
                        {...register(day)}
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isView}
                        className={cn('day-input', isView && 'bg-gray-50 cursor-not-allowed')}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Section: Resumo */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-300 inline-block" />
                Resumo
                <span className="flex-1 h-px bg-gray-100 inline-block" />
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Total Programado</p>
                  <p className="text-3xl font-bold" style={{ color: '#D92214' }}>
                    {liveTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Soma de D01 a D31</p>
                </div>
                <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">PMP do Mês</p>
                  <p className="text-3xl font-bold text-gray-700">
                    {(Number(watchedValues.pmpmes) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Meta planejada</p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <button onClick={onClose} className="btn-secondary">
            {isView ? 'Fechar' : 'Cancelar'}
          </button>
          {!isView && (
            <button
              type="submit"
              form="pmp-form"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
