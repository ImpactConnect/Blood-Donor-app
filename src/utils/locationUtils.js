// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in kilometers

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

const toRad = (value) => {
  return (value * Math.PI) / 180
}

// Get formatted address from coordinates using reverse geocoding
export const getAddressFromCoords = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    )
    const data = await response.json()
    return data.display_name
  } catch (error) {
    console.error('Error getting address:', error)
    return null
  }
}

// Sort locations by distance from a reference point
export const sortByDistance = (locations, referencePoint) => {
  return locations.sort((a, b) => {
    const distanceA = calculateDistance(
      referencePoint.latitude,
      referencePoint.longitude,
      a.latitude,
      a.longitude
    )
    const distanceB = calculateDistance(
      referencePoint.latitude,
      referencePoint.longitude,
      b.latitude,
      b.longitude
    )
    return distanceA - distanceB
  })
} 