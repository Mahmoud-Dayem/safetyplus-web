import React from 'react'
import { supabase } from './supabaseClient'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
function Inbox() {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    const id = user?.companyId;

    async function getSafetyOfficers() {
        const { data, error } = await supabase
            .from('safetyofficers')  // 👈 your table name
            .select('*')              // fetch all columns

        if (error) {
            console.error('Error fetching safety officers:', error)
            return []
        }

        console.log('Safety officers:', data[0])
        return data
    }

    // Example usage
    getSafetyOfficers()
    return (
        <div>

        </div>
    )
}

export default Inbox
