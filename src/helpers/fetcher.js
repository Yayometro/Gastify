
export default function fetcher(){
<<<<<<< HEAD
    // let baseUrl = process.env.REACT_APP_APP_URL
    // const baseUrl = "http://localhost:3000";
    const baseUrl = "https://gastify-jair-vazquez-navarretes-projects.vercel.app"; 
=======
    const baseUrl = process.env.NEXT_PUBLIC_API_ROUTE
>>>>>>> main
    const apiRoute = "/api/"
    let fullPath = baseUrl.concat(apiRoute);
    
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
                const data = await res.json()
                return data
            } catch(e){
                console.log(e)
                throw new Error(e)
                // throw new Error("Something went wrong in the POST request to backend using FETCHER: ", e)
            }
        },
        getFullPath: function(path){
            const localPath = fullPath.concat(path)
            return localPath
        }
    }
}
