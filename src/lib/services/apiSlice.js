
// import {createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// let fullPath = "http://localhost:3000/api/";
// if(process.env.NEXTAUTH_URL){
//     fullPath = process.env.NEXTAUTH_URL.concat('/api/')
//     console.log(process.env.NEXTAUTH_URL.concat('/api/'))
// }


// export const apiSlice = createApi({
//     reducerPath: 'apiSlice',
//     baseQuery: fetchBaseQuery({
//         baseUrl: fullPath
//     }),
//     endpoints: (builder) => ({
//         getAllDataParams: builder.query({
//             query: (id) => `general-data/${id}`
//         }),
//         getAllData: builder.mutation({
//             query: (email) => ({
//                 url: `general-data`, //fullPath mas end point general data
//                 method: 'POST',
//                 body: email
//             }) 
//         }),
//     }),
    
// })

// export const {useGetAllDataParamsQuery , useGetAllDataMutation } = apiSlice

/*
getAllData: builder.mutation({
            query: (email) => ({
                url: `general-data`, //fullPath mas end point general data
                method: 'POST',
                body: email
            }) 
        })
*/