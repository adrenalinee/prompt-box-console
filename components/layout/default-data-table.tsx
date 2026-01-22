import { DataTable, DataTableColumn, DataTableRowClickHandler, DataTableRowExpansionProps } from "mantine-datatable";
import { Center, MantineSize } from "@mantine/core";

/**
 *
 */
type DefaultDataTableProps<T = Record<string, unknown>> = {
  idAccessor: string
  records?: T[]
  columns: DataTableColumn<T>[]
  withTableBorder?: boolean
  borderRadius?: number|MantineSize|string|undefined
  highlightOnHover?: boolean
  noHeader?: boolean
  noRecordsText?: string
  rowExpansion?: DataTableRowExpansionProps<T>
  rowClassName?: string | ((record: T, index: number) => string | undefined)
  onRowClick?: DataTableRowClickHandler<T>
  className?: string
}

/**
 *
 * @param idFieldName
 * @param records
 * @param columns
 * @param noHeader
 * @param noRecordsText
 * @param rowExpansion
 * @param onRowClick
 * @param rowBackgroundColor
 * @constructor
 */
export default function DefaultDataTable<T>({
  idAccessor,
  records,
  columns,
  withTableBorder,
  borderRadius,
  highlightOnHover,
  noHeader,
  noRecordsText,
  rowExpansion,
  rowClassName,
  onRowClick,
  className,
  // rowBackgroundColor,
  // rowClassName,
  // rowColor
}: DefaultDataTableProps<T>) {
  if ((records?? []).length == 0) {
    return (
      <Center>{noRecordsText?? 'no data'}</Center>
    )
  }

  return (
    <DataTable
      withTableBorder={withTableBorder??true}
      borderRadius={borderRadius??"md"}
      highlightOnHover={highlightOnHover??true}
      noHeader={noHeader??false}
      verticalSpacing="xs"
      records={records}
      columns={columns}
      idAccessor={idAccessor}
      rowExpansion={rowExpansion}
      rowClassName={rowClassName}
      onRowClick={onRowClick}
      className={className}
    />
  )
}