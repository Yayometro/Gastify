"use client";
import React, { useEffect } from "react";
import { useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn } from "next-auth/react";
import Link from "next/link";
import runNotify from "@/helpers/gastifyNotifier";
import { quantum } from "ldrs";

function LoginComponent() {
  const [formData, setFormData] = useState({
    mail: "",
    password: "",
  });
  const [errorForm, setErrorForm] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParamas = useSearchParams();
  const email = searchParamas.get("mail");

  useEffect(() => {
    if (email) {
      runNotify("ok", `${email} was created successfully 🤓`);
    }
  }, []);

  //Loader
  quantum.register()

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const googleSignIn = async () => {
    try {
      setLoading(true);
      const reqGoogle = await signIn("google");
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  };
  const githubSignIn = async () => {
    try {
      setLoading(true);
      const reqGithub = await signIn("github");
    } catch (e) {
      console.log(e);
    }
  };
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setLoading(true);
      // AUTH
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
        runNotify(
          "error",
          "Something went wrong, please verify your username or try again later 🤕"
        );
        router.push("/login");
        setLoading(false); 
      }
      if (authResponse.error) {
        console.log(authResponse);
        let msg = String(authResponse.error).slice(6);
        runNotify("error", msg)
        // setErrorForm(msg);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (e) {
      console.log(e);
      setLoading(false);
      throw new Error(e);
    }
  };
  return (
    <div className="login-componnt-cont flex flex-col w-[95%] h-[95%] sm:w-[550px] sm:h-[650px] relative rounded-2xl items-center justify-center sm:pt[20px] overflow-y-auto">
      <div className="loader">
        {!loading ? (
          ""
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center bg-white/80 z-50 absolute text-center p-4 gap-4 left-0">
            <l-quantum size="150" speed="3.1" color="purple"></l-quantum>
            <p className=" text-xl text-purple-800">
              We are working to set everything up for you
            </p>
            <p className=" text-xl text-purple-800">Please wait a moment 🤓</p>
          </div>
        )}
      </div>
      <div className="pb-4 pt-10">
        <h1 className="text-center text-white text-2xl font-normal">
          Login to use Gastify 💸
        </h1>
      </div>
      <div className="form-container bg-white w-full rounded-t-[100px] h-full m-auto">
        <form
          className="form-login w-full h-full text-center flex flex-col gap-4 justify-start items-center pt-2 sm:pt-10"
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
