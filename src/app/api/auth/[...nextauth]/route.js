
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/model/User";
import bcrypt from 'bcryptjs'
import dbConnection from "../../dbConnection";
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from "next-auth/providers/facebook"; 
import GitHubProvider from "next-auth/providers/github";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {},
            async authorize(credentials, req) {
                try{
                    await dbConnection()
                    const userFound = await User.findOne({mail: credentials.mail}).lean()
                    if(!userFound) {
                        throw new Error("User not found");
                    }
                    const matchPass = await bcrypt.compare(credentials.password, userFound.password)
                    console.log('Llego aqui')
                    if(!matchPass) throw new Error("Password incorrect");
                    userFound.password = "";
                    console.log('Llego aqui')
                    console.log(userFound)
                    //This return goes to the TOKEN value - according with the TOKEN
                    return userFound
                } catch(e){
                    console.log({message: "something was wrong", error: e})
                    console.log(e)
                    throw new Error(e)
                }
            }
        }),
        GoogleProvider({
            name: "google",
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
          }),
          GitHubProvider({
            name: 'github',
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET
          }),
        //   FacebookProvider({
        //     name: "facebook",
        //     clientId: process.env.FACEBOOK_CLIENT_ID,
        //     clientSecret: process.env.FACEBOOK_CLIENT_SECRET
        //   })

    ],
    pages: {
        signIn: '/login'
    },
    callbacks: { //Once authorize return the obj, the obj will be saved in the token  here in a new variable.user
        async signIn({account, profile, user, email, credentials}){
            if (account.provider === "credentials") {
                console.log(account) //provides the access token and id_token
                console.log(profile)
                console.log(user)
                console.log(email)
                console.log(credentials)
                if(!user){
                    return null
                }
                return true
            }
            if(account.provider === "google"){
                console.log('Llego aqui')
                console.log(account) //provides the access token and id_token
                console.log(profile)
                console.log(user)
                console.log(email)
                console.log(credentials)
                await dbConnection();
                if(user){
                    const userGoogleFound = await User.findOne({mail: user.email}).lean()
                    console.log(userGoogleFound)
                    console.log('Llego aqui')
                    if(!userGoogleFound){
                        console.log('Llego aqui')
                        const userReq = {
                            fullName: user.name,
                            mail: user.email,
                            password: user.id,
                            image: user.image? user.image : ""
                        }
                        console.log('Llego aqui')
                        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/register`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                // Puedes agregar otras cabeceras según sea necesario
                              },
                              body: JSON.stringify(userReq),
                        })
                        console.log('Llego aqui')
                        if(!res) throw new Error("User could not be created using Google Account verify the request to register in api")
                        const dataFromRegister = await res.json()
                        console.log(dataFromRegister)
                        if(dataFromRegister.data){
                            // profile.fullUser = res.data
                            return profile.email_verified && profile.email.endsWith("@gmail.com");
                        }
                    }
                    console.log(userGoogleFound)
                    profile.fullUser = userGoogleFound
                    return profile.email_verified && profile.email.endsWith("@gmail.com")
                }
                console.log('Llego aqui')
                return profile.email_verified && profile.email.endsWith("@gmail.com")
            }
            if(account.provider === "github"){
                console.log('Llego aqui')
                console.log(account) //provides the access token and id_token
                console.log(profile)
                console.log(user)
                console.log(email)
                console.log(credentials)
                await dbConnection();
                if(user){
                    const userGithubFound = await User.findOne({mail: user.email}).lean()
                    const userGithubFoundById = await User.findOne({mail: user.id}).lean()
                    console.log(userGithubFound)
                    console.log('Llego aqui')
                    console.log(user)
                    if(userGithubFound){
                        return true
                    }
                    if(userGithubFoundById){
                        profile.email = userGithubFoundById.mail
                        user.email = userGithubFoundById.mail
                        return true
                    }
                    if(!userGithubFound && !userGithubFoundById){
                        console.log('No user in gitHub founded in DB')
                        let userReq;
                        if(!user.mail){
                            userReq = {
                                fullName: user.name,
                                mail: user.id,
                                password: user.id,
                                image: user.image? user.image : ""
                            } 
                        }
                        console.log('Llego aqui')
                        if(user.email){
                            userReq = {
                                fullName: user.name,
                                mail: user.email,
                                password: user.id,
                                image: user.image? user.image : ""
                            }
                        }
                        console.log('Llego aqui')
                        console.log(userReq)
                        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/register`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                // Puedes agregar otras cabeceras según sea necesario
                              },
                              body: JSON.stringify(userReq),
                        })
                        console.log('Llego aqui')
                        if(!res) throw new Error("User could not be created using Google Account verify the request to register in api")
                        const dataFromRegister = await res.json()
                        console.log(dataFromRegister)
                        if(dataFromRegister.data){
                            profile.email = dataFromRegister.data.mail;
                            user.email = dataFromRegister.data.mail;
                            return true
                        }
                    }
                    // if()
                    console.log(userGithubFound)
                    profile.fullUser = userGithubFound
                    return true
                }
                console.log('Llego aqui')
                return true
            }
        },
        jwt({token, user, account, profile}){
            // console.log('llego al token')
            console.log(profile)
            console.log(account)
            console.log(token)
            console.log(user)
    
            if(user){
                if(account.type === 'credentials'){
                    console.log(user)
                    // token.user = user; //Try to remove it later
                    token.name = user.fullName
                    token.email = user.mail
                    token.picture = user.image ? user.image : "";
                    // console.log({inToken: {token: token, user: user}})
                    return token
                }
                if(account.provider === 'google'){
                    console.log(user)
                    console.log(profile)
                    // token.user = profile.fullUser;
                    return token
                }
                if(account.provider === 'github'){
                    console.log(user)
                    console.log(profile)
                    // token.user = profile.fullUser;
                    return token
                }
            }
            return token //Info available in backend
        },
        session({session, token, user}){ 
            console.log(session, token, user)
            console.log('Sesion se esta usando')
            if(token.user){
                console.log(session)
                user = token.user
                session.user.fullUser = token.user;
                return session
            }
            // if(!user){
            //     console.log('No hay user en session')
            //     if(token){
            //         console.log('Token true in session')
            //         user = token
            //     }
            // }
            // console.log(user)
            // if(!session.user){
            //     if(user){
            //         session.user = user
            //     }
            // }
            // if(!session.user.name && !session.user.email ){
            //     console.log('name y mail estan vacios en session')
            //     if(user.user.fullName && user.user.mail){
            //         console.log('activo')
            //         session.user.name = user.user.fullName
            //         session.user.email = user.user.mail
            //     }
            // }
            // session.user = token.user
            
            console.log(session, token, user)
            return session
        },
        
    },
    secret: process.env.NEXTAUTH_SECRET,
    events: {
        CredentialsProvider(message) {
          console.log('CredentialsProvider message', message)
        },
        signIn(message) {
          console.log('Sign message', message)
        },
        signOut(message) {
          console.log(message)
        },
      },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
