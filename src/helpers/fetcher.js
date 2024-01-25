
export default function fetcher(){
    // let baseUrl = process.env.REACT_APP_APP_URL
    const baseUrl = "http://localhost:3000";
    const apiRoute = "/api/"
    let fullPath = baseUrl.concat(apiRoute);
    console.log(fullPath)
    if(process.env.NEXTAUTH_URL){
        console.log(process.env.NEXTAUTH_URL)
        fullPath = process.env.NEXTAUTH_URL.concat(apiRoute)
    }
    console.log(fullPath)
    console.log(baseUrl)
    console.log(apiRoute)
    console.log(process.env)
    return {
        get: async function(path){
            try{
                if(!fullPath) throw new Error("The is no fullPath in PATH")
                const localPath = fullPath.concat(path)
                const res = await fetch(localPath, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                })
                const data = await res.json()
                return data
            } catch(e){
                throw new Error(e)
            }
        },
        post: async function(path, content){
            try{
                if(!fullPath) throw new Error("The is no fullPath in PATH")
                const localPath = fullPath.concat(path)
                const res = await fetch(localPath, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(content)
                })
                if(!res) throw new Error("No data from response")
                console.log(res)
                const data = await res.json()
                console.log(data)
                return data
            } catch(e){
                throw new Error(e)
                throw new Error("Something went wrong in the POST request to backend using FETCHER: ", e)
            }
        }
    }
}
// export default async function fetcherNo(verb, path, content ){
//     const verbo = String(verb).toUpperCase;
//     try{
//         if(verbo === "GET"){
//             const res = await fetch(`/api/${path}`, {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//             });
//             const data = await res.json();
//             console.log({dataFromFetcher: {data}})
//             return data.json()
//         } else if(verb === "POST"){
//             const res = await fetch(`/api/${path}`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(content)
//             });
//             const data = await res.json();
//             console.log({dataFromFetcher: {data}})
//             return data
//         }
//     } catch(e) {
//         throw new Error(e)
//     }
// }

