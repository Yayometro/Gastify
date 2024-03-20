"use client";
import React, { useEffect, useState } from "react";
import fetcher from "@/helpers/fetcher"; // (verb, path, content )
import bcryptjs from "bcryptjs";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { quantum } from "ldrs";

export default function RegisterComp({ params }) {
  const [formData, setFormData] = useState({
    fullName: "",
    mail: "",
    password: "",
    termnsYes: false,
    formError: "",
  });
  const [validationMessages, setValidationMessages] = useState({
    passLength: "hidden",
    passCapital: "hidden",
    passSpecial: "hidden",
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false)

  //Loader
  quantum.register()

  const passString =
    'The password must have at least one special character "!@#$%^&*(),.?":{}|<>".';
  const regexCapital = /[A-Z]/;
  const regexSpecial = /[!@#$%^&*(),.?":_{}|<>]/;

  useEffect(() => {
    const updateValidationMessages = () => {
      const newMessages = {
        passLength: formData.password.length < 8 ? "" : "hidden",
        passCapital: regexCapital.test(formData.password) ? "hidden" : "",
        passSpecial: regexSpecial.test(formData.password) ? "hidden" : "",
      };
      setValidationMessages(newMessages);
    };

    if (formData.password.length > 0) {
      updateValidationMessages();
    }
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const googleSignIn = async () => {
    try{
      setLoading(true)
      const reqGoogle = await signIn("google");
    } catch(e){
      console.log(e)
      throw new Error(e)
    }
  };
  const githubSignIn = async () => {
    try{
      setLoading(true)
      const reqGithub = await signIn("github");
    } catch(e){
      console.log(e)
    }
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setLoading(true);
      // Send data to backend using fetcher(formData)
      console.log(formData);
      if (formData.termnsYes === false) {
        window.alert("Accept the terms and conditions");
      }
      //password validation:
      if (
        formData.password.length < 8 ||
        !regexCapital.test(formData.password) ||
        !regexSpecial.test(formData.password)
      ) {
        window.alert(
          "Verify that password length is higher than 8, that also includes min one capital letter and has at least one special character"
        );
        console.log(formData.password);
        setFormData({ ...formData, password: "" });
        return false;
      }

      const toBack = fetcher();
      const response = await toBack.post("register", formData);
      console.log(response);
      //
      if (response.error) {
        if (response.errorUser) {
          setFormData({ ...formData, formError: "Email already exist" });
          return;
        }
        //Some other error aside user in use
        window.alert(response.error);
        setFormData({ ...formData, mail: "" });
        return;
      }
      if (response.userCreatedStatus) {
        router.push(`/login?mail=${formData.mail}`);
      }
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  };
  //refresh y accesstoken con JWT - medium
  return (
    <div className="login-componnt-cont  flex flex-col w-[97%] h-[100%] sm:w-[550px] sm:h-[750px] relative rounded-2xl items-center justify-center sm:pt[20px] overflow-y-auto">
       <div className="loader">
      {
              !loading ? ('') : (
                <div className="w-full h-full flex flex-col justify-center items-center bg-white/80 z-50 absolute text-center p-4 gap-4 left-0">
                  <l-quantum size="150" speed="3.1" color="purple"></l-quantum>
                  <p className=" text-xl text-purple-800">We are building up your dashboard and data</p>
                  <p className=" text-xl text-purple-800">Please wait a moment 🤓</p>
                </div>
              )
            }
      </div>
      <div className="py-5">
        <h1 className="text-center text-white text-2xl font-normal">
          Register
        </h1>
      </div>
      <div className="form-container bg-white w-full rounded-t-[100px] h-full m-auto">
        <form
          className="form-login w-full h-full text-center flex flex-col gap-4 justify-start items-center pt-5 sm:pt-10"
          onSubmit={handleSubmit}
        >
          <div className="w-full flex flex-col justify-center items-center gap-1">
            <label htmlFor="fullName" className="">
              Fullname or nickname
            </label>
            <input
              name="fullName"
              type="text"
              className="form-control"
              id="nameForm"
              aria-describedby="nameH"
              placeholder="Type your full name or alias."
              value={formData.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="w-full flex flex-col justify-center items-center gap-1">
            <label htmlFor="email" className="">
              Email address
            </label>
            <input
              name="mail"
              type="email"
              className="form-control"
              id="mailForm"
              aria-describedby="maillHelp"
              placeholder="roberto.Gomez@gmail.com..."
              value={formData.mail}
              onChange={handleChange}
              required
            />
            <div
              id="emailHelp"
              className="form-text-never w-[90%] font-light text-[10px] text-slate-400"
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
            <div
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
            </div>
            <div
              id="emailHelp"
              className="form-text-never w-[90%] font-light text-[10px] text-slate-400"
            >
              We will never share your email with anyone else.
            </div>
            <div className="form-check w-full flex flex-row gap-1 justify-center items-center">
              <div className="">
                <input
                  name="termnsYes"
                  type="checkbox"
                  className="form-check-input rounded-full border-2 border-purple-600"
                  id="exampleCheck1"
                  checked={formData.termnsYes}
                  onChange={handleChange}
                />
              </div>
              <div className="form-text-never w-fit font-light text-[12px] text-slate-400">
                <p className="w-fit">I agree to terms and conditions</p>
              </div>
            </div>
              {formData.formError && (
                <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
                  {formData.formError}
                </div>
              )}
          </div>
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
            <div className="text-purple-700 w-[90%] text-xs hover:underline pb-[30px]">
              <Link href="/login">
                <p>You have an account already? - Login here</p>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
