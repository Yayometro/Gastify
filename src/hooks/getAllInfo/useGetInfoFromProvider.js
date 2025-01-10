
import { AllDataContext } from "@/components/Providers/AllDataProvider"
import { useContext } from "react"

export default function useGetDataFromProvider(){
    const context = useContext(AllDataContext)
    if(!context) throw new Error("No context provided in custom hook")
    return context
}