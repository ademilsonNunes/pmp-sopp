import { useMemo, useState } from 'react'
import { CalendarDays, Plus, RefreshCw, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../components/layout/Navbar'
import {
  useActivateFeriado,
  useCreateFeriado,
  useDeactivateFeriado,
  useFeriadosList,
} from '../hooks/useFeriados'
import { getErrorMessage } from '../lib/utils'
import type { Feriado } from '../types'

const currentYear = new Date().getFullYear()

export default function FeriadosPage() {
  const [ano, setAno] = useState(currentYear)
  const [somenteAtivos, setSomenteAtivos] = useState(false)
  const [search, setSearch] = useState('')

  const [dataFeriado, setDataFeriado] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('NACIONAL')

  const {
    data: feriados = [],
    isLoading,
    isFetching,
    refetch,
  } = useFeriadosList({
    ano,
    somente_ativos: somenteAtivos,
  })

  const createFeriado = useCreateFeriado()
  const activateFeriado = useActivateFeriado()
  const deactivateFeriado = useDeactivateFeriado()

  const filteredFeriados = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return feriados

    return feriados.filter((f) =>
      [f.data_feriado, f.descricao, f.tipo].some((value) =>
        String(value || '').toLowerCase().includes(q),
      ),
    )
  }, [feriados, search])

  const ativos = feriados.filter((f) => f.is_active).length
  const inativos = feriados.filter((f) => !f.is_active).length

  const formatDate = (value: string) => {
    if (!value) return '-'

    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!dataFeriado) {
      toast.error('Informe a data do feriado')
      return
    }

    if (!descricao.trim()) {
      toast.error('Informe a descrição do feriado')
      return
    }

    try {
      await createFeriado.mutateAsync({
        data_feriado: dataFeriado,
        descricao: descricao.trim(),
        tipo,
      })

      toast.success('Feriado cadastrado com sucesso!')

      setDataFeriado('')
      setDescricao('')
      setTipo('NACIONAL')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleToggleStatus = async (feriado: Feriado) => {
    try {
      if (feriado.is_active) {
        await deactivateFeriado.mutateAsync(feriado.id)
        toast.success('Feriado inativado com sucesso!')
      } else {
        await activateFeriado.mutateAsync(feriado.id)
        toast.success('Feriado reativado com sucesso!')
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-16">
        <div
          className="px-4 sm:px-6 py-6"
          style={{ background: 'linear-gradient(135deg, #32373c 0%, #1a1d20 100%)' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  Feriados
                </h1>
                <p className="text-gray-400 text-sm">
                  Cadastre os feriados usados no cálculo de dias úteis do dashboard
                </p>
              </div>

              <button
                onClick={() => refetch()}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Atualizar"
              >
                <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CalendarDays size={20} className="text-primary-light" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                      Total no ano
                    </p>
                    <p className="text-white text-2xl font-bold">{feriados.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <ToggleRight size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                      Ativos
                    </p>
                    <p className="text-white text-2xl font-bold">{ativos}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <ToggleLeft size={20} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                      Inativos
                    </p>
                    <p className="text-white text-2xl font-bold">{inativos}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Plus size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Novo feriado</h2>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="label">Data</label>
                  <input
                    type="date"
                    value={dataFeriado}
                    onChange={(e) => setDataFeriado(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Descrição</label>
                  <input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="input-field"
                    placeholder="Ex.: Tiradentes"
                  />
                </div>

                <div>
                  <label className="label">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="input-field"
                  >
                    <option value="NACIONAL">Nacional</option>
                    <option value="ESTADUAL">Estadual</option>
                    <option value="MUNICIPAL">Municipal</option>
                    <option value="INTERNO">Interno</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createFeriado.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  {createFeriado.isPending ? 'Salvando...' : 'Cadastrar feriado'}
                </button>
              </form>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Feriados cadastrados
                </h2>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="number"
                    value={ano}
                    onChange={(e) => setAno(Number(e.target.value))}
                    className="input-field sm:w-28"
                    min={2000}
                    max={2100}
                  />

                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={somenteAtivos}
                      onChange={(e) => setSomenteAtivos(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Somente ativos
                  </label>

                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar feriado..."
                      className="input-field pl-9 sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="py-10 text-center text-gray-500">
                  Carregando feriados...
                </div>
              ) : filteredFeriados.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  Nenhum feriado encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">
                          Data
                        </th>
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">
                          Descrição
                        </th>
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">
                          Tipo
                        </th>
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="text-left py-3 font-semibold text-gray-700">
                          Ações
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredFeriados.map((feriado) => (
                        <tr key={feriado.id} className="border-b border-gray-100">
                          <td className="py-3 pr-3 font-medium text-gray-900">
                            {formatDate(feriado.data_feriado)}
                          </td>

                          <td className="py-3 pr-3 text-gray-700">
                            {feriado.descricao}
                          </td>

                          <td className="py-3 pr-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {feriado.tipo}
                            </span>
                          </td>

                          <td className="py-3 pr-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                feriado.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {feriado.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>

                          <td className="py-3">
                            <button
                              onClick={() => handleToggleStatus(feriado)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                feriado.is_active
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              {feriado.is_active ? (
                                <>
                                  <ToggleLeft size={14} />
                                  Inativar
                                </>
                              ) : (
                                <>
                                  <ToggleRight size={14} />
                                  Ativar
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}