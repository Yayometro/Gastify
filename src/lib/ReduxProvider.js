'use client'
import { Provider } from "react-redux" //This component comes from redux and will share across the app the store that 
// I already configured
import { store } from "./store"

//This component wraps the rest of it.
export default function ReduxProvider({children}){
    return <Provider store={store}>
        {children}
    </Provider>
}