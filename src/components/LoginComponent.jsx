"use client";
import React from "react";
import { useState, useEffect } from "react";
import fetcher from "@/helpers/fetcher"; // (verb, path, content )
import bcryptjs from "bcryptjs";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import { signIn } from "next-auth/react";
import Link from "next/link";

function LoginComponent() {
  const [formData, setFormData] = useState({
    mail: "",
    password: "",
  });
  const [errorForm, setErrorForm] = useState("");

  const router = useRouter();
  const searchParamas = useSearchParams();
  const email = searchParamas.get("mail");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const googleSignIn = async () => {
    const reqGoogle = await signIn("google");
  };
  const githubSignIn = async () => {
    const reqGithub = await signIn("github");
  };
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      // Send data to backend using fetcher(formData)
      console.log(formData);
      //password validation:
      // usando AUTH
      const authResponse = await signIn("credentials", {
        mail: formData.mail,
        password: formData.password,
        redirect: false,
      });
      if (!authResponse) {
        console.log(authResponse);
        setErrorForm(
          "Something went wrong, please verify your username or try again later 🤕"
        );
        router.push("/login");
      }
      if (authResponse.error) {
        console.log(authResponse);
        let msg = String(authResponse.error).slice(6);
        setErrorForm(msg);
        return;
      }
      console.log(authResponse);
      // router.replace("dashboard");
      router.push("/dashboard");
      //Vlidar si no hay respuesta ****

      //Must handle this cleaning form only if the response was successfull
      // setFormData({
      //     name: "",
      //     lastName: "",
      //     username: "",
      //     mail: "",
      //     password: "",
      //     termnsYes: false,
      // })
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  };
  return (
    <div className="login-componnt-cont  border-purple-600 flex flex-col w-[97%] h-[95%] sm:w-[550px] sm:h-[80%] relative rounded-2xl items-center justify-center pt-[10px] sm:pt[20px] overflow-y-auto">
      <div className="py-5">
        <h1 className="text-center text-white text-2xl font-normal">
          Login to use Gastify 💸
        </h1>
      </div>
      <div className="form-container bg-white w-full rounded-t-[100px] h-full m-auto">
        <form
          className="form-login w-full h-full text-center flex flex-col gap-4 justify-start items-center pt-5 sm:pt-10"
          onSubmit={handleSubmit}
        >
          <div className="w-full flex flex-col justify-center items-center gap-1">
            <label htmlFor="email" className="">
              Email address
            </label>
            <input
              name="mail"
              type="email"
              className=""
              id="mailForm"
              aria-describedby="maillHelp"
              placeholder="roberto.Gomez@gmail.com..."
              value={email ? (formData.mail = email) : formData.mail}
              onChange={handleChange}
              required
            />
            <div
              id="emailHelp"
              className="form-text-never w-[90%] font-light text-xs text-slate-400"
            >
              We will never share your email with anyone else.
            </div>
          </div>
          <div className="w-full flex flex-col justify-center items-center gap-1">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              name="password"
              type="password"
              className="form-control"
              id="passwordForm"
              value={formData.password}
              onChange={handleChange}
            />
            {/* <div
                className={"tooltipPwass"}
                style={{ color: "red", fontSize: "8px", textAlign: "center" }}
              >
                <p className={validationMessages.passLength}>
                  The password must have at least 8 characters.
                </p>
                <p className={validationMessages.passCapital}>
                  The password must have at least one capital letter.
                </p>
                <p className={validationMessages.passSpecial}>{passString}</p>
              </div> */}
            <div
              id="passwordHelp"
              className="form-text-never w-[90%] font-light text-xs text-slate-400"
            >
              We will never share your password with anyone else.
            </div>
          </div>
          {errorForm && (
            <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
              {errorForm}
            </div>
          )}
          <button type="submit" className="social-btn-lf">
            Submit
          </button>
          <div className="divider border-t-2 border-slate-300 w-[70%] mt-5"></div>
          <div className="bts-fast w-[100%] pt-5  flex flex-col gap-8 justify-center items-center">
            <div className="social-btn-lf" onClick={googleSignIn}>
              <div className="sblf-icon-cont">
                <FcGoogle size={25} />
              </div>
              <p>Google </p>
            </div>
            <div className="social-btn-lf " onClick={githubSignIn}>
              <div className="sblf-icon-cont">
                <FaGithub size={25} />
              </div>
              <p> GitHub</p>
            </div>
            <div className="text-purple-700 w-[90%] text-xs hover:underline">
              <Link href="/register">
                <p className="">You do not have an account? - Click here</p>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginComponent;
