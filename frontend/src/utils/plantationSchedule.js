const DAY_IN_MS = 24 * 60 * 60 * 1000

const normalizeDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  date.setHours(0, 0, 0, 0)
  return date
}

export const getPlantingScheduleState = (plantation) => {
  const isPlantationConfirmed =
    plantation?.datePlantationConfirmee !== null &&
    plantation?.datePlantationConfirmee !== undefined

  const plannedDate = normalizeDate(plantation?.datePlantation)
  const today = normalizeDate(new Date())

  if (!plannedDate || !today) {
    return {
      type: isPlantationConfirmed ? 'planted' : 'unknown',
      plannedDate: null,
    }
  }

  const diffDays = Math.round((plannedDate - today) / DAY_IN_MS)

  if (isPlantationConfirmed) {
    return {
      type: 'planted',
      plannedDate,
    }
  }

  if (diffDays > 0) {
    return {
      type: 'waiting',
      daysRemaining: diffDays,
      plannedDate,
    }
  }

  if (diffDays === 0) {
    return {
      type: 'today',
      plannedDate,
    }
  }

  return {
    type: 'overdue',
    daysLate: Math.abs(diffDays),
    plannedDate,
  }
}


