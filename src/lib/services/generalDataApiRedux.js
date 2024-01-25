// import { getServerSession } from "next-auth";
// import {createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// const sesion = await getServerSession();
//   // console.log(sesion)
//   if (!sesion) throw new Error('No session on General Data Api Redux Middleware')
//   if (!sesion.user.email) throw new Error('No email on session user in General Data Api Redux Middleware')
//  console.log(sesion)
// let fullPath = "http://localhost:3000/api/";
// if(process.env.NEXTAUTH_URL){
//     fullPath = process.env.NEXTAUTH_URL.concat('/api/')
//     console.log(process.env.NEXTAUTH_URL.concat('/api/'))
// }

// export const generalDataApi = createApi({
//     reducerPath: 'generalDataApi',
//     baseQuery: fetchBaseQuery({
//         baseUrl: fullPath
//     }),
//     endpoints: (builder) => ({
//         getAllData: builder.mutation({
//             query: ({email}) => ({
//                 url: `general-data`, //fullPath mas end point general data
//                 method: 'POST',
//                 body: email
//             }) 
//         })
//     })
// })

// const {useGetAllDataMutation} = generalDataApi