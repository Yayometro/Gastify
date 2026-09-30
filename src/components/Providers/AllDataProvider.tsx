"use client"
import useFetchAndGetAllReduxInfo from '@/hooks/getAllInfo/useFetchAndGetAllReduxInfo'
import React, { createContext } from 'react'
import type { AllDataContextValue } from '@/hooks/getAllInfo/useGetInfoFromProvider'

export interface AllDataProviderProps {
  children?: React.ReactNode;
}

export const AllDataContext = createContext<AllDataContextValue>({
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
function AllDataProvider({children}: AllDataProviderProps) {
    const data = useFetchAndGetAllReduxInfo()
  return <AllDataContext.Provider value={data as AllDataContextValue}>
    {children}
  </AllDataContext.Provider>
}

export default AllDataProvider