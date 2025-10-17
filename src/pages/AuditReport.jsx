import React from 'react'
import { supabase } from './supabaseClient'
function AuditReport() {

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')     // 👈 your table name
        .select('*')             // fetch all columns

      if (error) {
        console.error('Error fetching data:', error)
      } else {
        console.log('Departments table data:', data)
      }
    }

    fetchDepartments()
  }, [])

  return (
    <div>
      <h1>Supabase Test</h1>
      <p>Check console for departments table data.</p>
    </div>
  )
}

export default AuditReport
