import { useState, useEffect } from 'react'

const useGeolocation = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords
      setLocation({
        latitude,
        longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      })
      setLoading(false)
      setError(null)
    }

    const handleError = (error) => {
      setError(error.message)
      setLoading(false)
    }

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { location, error, loading }
}

export default useGeolocation 