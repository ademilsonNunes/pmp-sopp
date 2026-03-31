import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, ClipboardList } from 'lucide-react'
import { cn, formatMesRef, formatNumber, formatDate } from '../../lib/utils'
import type { ZpmRecord } from '../../types'

interface PmpTableProps {
  data: ZpmRecord[]
  loading: boolean
  onView: (record: ZpmRecord) => void
  onEdit: (record: ZpmRecord) => void
  onDelete: (record: ZpmRecord) => void
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="table-cell">
          <div className="skeleton h-4 rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ChevronUp size={14} className="text-primary" />
  if (sorted === 'desc') return <ChevronDown size={14} className="text-primary" />
  return <ChevronsUpDown size={14} className="text-gray-400" />
}

export default function PmpTable({ data, loading, onView, onEdit, onDelete }: PmpTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<ZpmRecord>[] = [
    {
      accessorKey: 'prod',
      header: 'Produto',
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-gray-900 text-sm">{row.original.prod}</p>
          <p className="text-xs text-gray-400">Filial: {row.original.filial}</p>
        </div>
      ),
    },
    {
      accessorKey: 'desc',
      header: 'Descrição',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-700 line-clamp-2 max-w-xs block">
          {getValue() as string || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'linha',
      header: 'Linha',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 font-medium">
          {getValue() as string || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'mesref',
      header: 'Mês Ref.',
      cell: ({ getValue }) => (
        <span className="text-sm font-semibold text-gray-700">
          {formatMesRef(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'pmpmes',
      header: 'PMP Mês',
      cell: ({ getValue }) => (
        <span className="text-sm font-semibold text-gray-800">
          {formatNumber(getValue() as number)}
        </span>
      ),
    },
    {
      accessorKey: 'totpg',
      header: 'Total Prog.',
      cell: ({ row }) => {
        const pct = row.original.pmpmes > 0
          ? (row.original.totpg / row.original.pmpmes) * 100
          : null
        return (
          <div>
            <p className="text-sm font-bold" style={{ color: '#D92214' }}>
              {formatNumber(row.original.totpg)}
            </p>
            {pct !== null && (
              <p className="text-xs text-gray-400">{pct.toFixed(1)}%</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'origem',
      header: 'Origem',
      cell: ({ getValue }) => {
        const v = getValue() as string
        return (
          <span className={cn('badge', v === 'I' ? 'badge-blue' : 'badge-green')}>
            {v === 'I' ? 'Importado' : 'Manual'}
          </span>
        )
      },
    },
    {
      id: 'auditoria',
      header: 'Auditoria',
      cell: ({ row }) => (
        <div className="text-xs text-gray-400">
          <p>{formatDate(row.original.dtimpt)}</p>
          <p className="truncate max-w-24">{row.original.usrimpt || '-'}</p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onView(row.original) }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Visualizar"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row.original) }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row.original) }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Excluir"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b-2 border-gray-100">
            {table.getHeaderGroups().map((hg) =>
              hg.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    'table-header select-none',
                    header.column.getCanSort() && 'cursor-pointer hover:bg-gray-100 transition-colors'
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon sorted={header.column.getIsSorted()} />
                    )}
                  </div>
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ClipboardList size={28} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-semibold">Nenhum registro encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Tente ajustar os filtros ou importe dados via CSV
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-gray-50 cursor-pointer transition-colors',
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                  'hover:bg-primary/5'
                )}
                onClick={() => onView(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="table-cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
