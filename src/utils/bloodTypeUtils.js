const bloodTypeCompatibility = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
}

export const canDonate = (donorType, recipientType) => {
  return bloodTypeCompatibility[donorType]?.includes(recipientType) || false
}

export const findCompatibleDonors = (recipientType, donors) => {
  return donors.filter(donor => 
    Object.entries(bloodTypeCompatibility)
      .filter(([_, compatible]) => compatible.includes(recipientType))
      .map(([type]) => type)
      .includes(donor.bloodType)
  )
}

export const getCompatibleTypes = (bloodType) => {
  return bloodTypeCompatibility[bloodType] || []
}

export const getAllBloodTypes = () => {
  return Object.keys(bloodTypeCompatibility)
} 