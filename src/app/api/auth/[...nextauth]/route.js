
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
                    if(!matchPass) throw new Error("Password incorrect");
                    userFound.password = "";
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
    ],
    pages: {
        signIn: '/login'
    },
    callbacks: { //Once authorize return the obj, the obj will be saved in the token  here in a new variable.user
        async signIn({account, profile, user, email, credentials}){
            if (account.provider === "credentials") {
                if(!user){
                    return null
                }
                return true
            }
            if(account.provider === "google"){
                await dbConnection();
                if(user){
                    const userGoogleFound = await User.findOne({mail: user.email}).lean()
                    console.log(userGoogleFound)
                    if(!userGoogleFound){
                        const userReq = {
                            fullName: user.name,
                            mail: user.email,
                            password: user.id,
                            image: user.image? user.image : ""
                        }
                        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/register`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(userReq),
                        })
                        if(!res) throw new Error("User could not be created using Google Account verify the request to register in api")
                        const dataFromRegister = await res.json()
                        if(dataFromRegister.data){
                            return profile.email_verified && profile.email.endsWith("@gmail.com");
                        }
                    }
                    profile.fullUser = userGoogleFound
                    return profile.email_verified && profile.email.endsWith("@gmail.com")
                }
                return profile.email_verified && profile.email.endsWith("@gmail.com")
            }
            if(account.provider === "github"){
                await dbConnection();
                if(user){
                    const userGithubFound = await User.findOne({mail: user.email}).lean()
                    const userGithubFoundById = await User.findOne({mail: user.id}).lean()
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
                        if(user.email){
                            userReq = {
                                fullName: user.name,
                                mail: user.email,
                                password: user.id,
                                image: user.image? user.image : ""
                            }
                        }
                        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/register`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                // Puedes agregar otras cabeceras según sea necesario
                              },
                              body: JSON.stringify(userReq),
                        })
                        if(!res) throw new Error("User could not be created using Google Account verify the request to register in api")
                        const dataFromRegister = await res.json()
                        if(dataFromRegister.data){
                            profile.email = dataFromRegister.data.mail;
                            user.email = dataFromRegister.data.mail;
                            return true
                        }
                    }
                    profile.fullUser = userGithubFound
                    return true
                }
                return true
            }
        },
        jwt({token, user, account, profile}){
            if(user){
                if(account.type === 'credentials'){
                    token.name = user.fullName
                    token.email = user.mail
                    token.picture = user.image ? user.image : "";
                    return token
                }
                if(account.provider === 'google'){
                    return token
                }
                if(account.provider === 'github'){
                    return token
                }
            }
            return token //Info available in backend
        },
        session({session, token, user}){ 
            if(token.user){
                user = token.user
                session.user.fullUser = token.user;
                return session
            }
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
