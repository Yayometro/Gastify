/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FetcherInstance {
  // any acotado como default en el retorno porque los endpoints devuelven shapes JSON variables ({ok, data, message, etc.}) consumidas de distintas formas por ~38 archivos
  get: <T = any>(path: string) => Promise<T>;
  post: <T = any>(path: string, content?: unknown) => Promise<T>;
  getFullPath: (path: string) => string;
}

export default function fetcher(): FetcherInstance {
    // 

    const baseUrl = process.env.NEXT_PUBLIC_API_ROUTE
    const apiRoute = "/api/"
    const fullPath = baseUrl.concat(apiRoute);
    
    return {
        get: async function<T = any>(path: string): Promise<T>{
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
                throw new Error(e as unknown as string)
            }
        },
        post: async function<T = any>(path: string, content?: unknown): Promise<T>{
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
                throw new Error(e as unknown as string)
                // throw new Error("Something went wrong in the POST request to backend using FETCHER: ", e)
            }
        },
        getFullPath: function(path: string): string{
            const localPath = fullPath.concat(path)
            return localPath
        }
    }
}
