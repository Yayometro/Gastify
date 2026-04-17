"use client"
import useFetchAndGetAllReduxInfo from '@/hooks/getAllInfo/useFetchAndGetAllReduxInfo'
import React, { createContext } from 'react'

export const AllDataContext = createContext({
    user: null,
    wallet: null,
    accounts: [],
    categories: {
        default: [],
        user: []
    },
    subCategories: {
        default: [],
        subCat: []
    },
    transacciones: [],
    budgets: [],
    tags: [],
    loading: true, 
  })
function AllDataProvider({children}) {
    const data = useFetchAndGetAllReduxInfo()
  return <AllDataContext.Provider value={data}>
    {children}
  </AllDataContext.Provider>
}

export default AllDataProvider