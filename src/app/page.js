import Image from 'next/image'
import Link from 'next/link'


export default function Home() {
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="bg-stone-50 flex flex-col items-center py-12">
      <div className="w-full max-w-[1218px] mt-36 max-md:max-w-full max-md:mt-10">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0">
          <div className="flex flex-col items-stretch w-[39%] max-md:w-full max-md:ml-0">
            <div className="flex flex-col px-5 max-md:max-w-full max-md:mt-10">
              <div className="items-stretch mix-blend-multiply bg-purple-50 flex gap-3 pl-1 pr-2.5 py-1 rounded-2xl self-start">
                <div className="text-violet-700 text-center text-sm font-medium leading-5 whitespace-nowrap items-stretch bg-white aspect-[3.0833333333333335] justify-center px-2.5 py-0.5 rounded-2xl">
                  Express
                </div>
                <div className="items-stretch self-center flex gap-1 my-auto">
                  <div className="text-violet-700 text-sm font-medium leading-5 grow whitespace-nowrap">
                    Subscribe now
                  </div>

                  {/* <img
                    loading="lazy"
                    src="/Laptop.png"
                    className="aspect-square object-contain object-center w-4 overflow-hidden self-center shrink-0 max-w-full my-auto"
                  /> */}
                </div>
              </div>
              <div className="text-zinc-900 text-5xl font-bold tracking-tighter self-stretch mt-7 max-md:max-w-full max-md:text-4xl">
                <span className="font-medium leading-[60.5113639831543px] text-violet-600">
                  Discover
                </span>
                <span className="font-medium"> your spending habits in </span>
                <span className="font-medium text-violet-600">1 min</span>
              </div>
              <div className="text-zinc-700 text-xl leading-8 self-stretch mt-9 max-md:max-w-full">
                Register your expenses, import your Bank Statements directly
                using Excel or XLM files
              </div>
              <div className="self-stretch flex items-stretch justify-between gap-5 mt-9 max-md:max-w-full max-md:flex-wrap">
                <Link 
                    href="/login"
                    className="text-zinc-700 text-base font-bold leading-8 uppercase items-stretch border-[color:var(--Alert-Content-Header,#1B1C20)] bg-white grow justify-center px-6 py-4 rounded-xl border-[0.628px] border-solid max-md:px-5">
                  <p>Login 🤓</p>
                </Link>
                <Link 
                    href="/register"
                    className="text-zinc-700 text-base font-bold leading-8 uppercase items-stretch border-[color:var(--Alert-Content-Header,#1B1C20)] bg-white grow justify-center px-6 py-4 rounded-xl border-[0.628px] border-solid max-md:px-5">
                  RegistER ME ❤️
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-stretch w-[61%] ml-5 max-md:w-full max-md:ml-0">
            <img
              loading="lazy"
              src="/Laptop.png"
              className="aspect-[1.5] object-contain object-center w-full shadow-2xl overflow-hidden grow mt-1.5 max-md:max-w-full max-md:mt-10"
            />
            {/* <Image 
              src="/Laptop.png"
              width="100"
              height="100"
              alt="chip"
              className="aspect-[1.5] object-contain object-center w-full shadow-2xl overflow-hidden grow mt-1.5 max-md:max-w-full max-md:mt-10"
            /> */}
          </div>
        </div>
      </div>
      <div className="self-stretch mr-9 mt-28 max-md:max-w-full max-md:mr-2.5 max-md:mt-10">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0">
          <div className="flex flex-col items-stretch w-[54%] max-md:w-full max-md:ml-0">
            <img
              loading="lazy"
              srcSet="https://cdn.builder.io/api/v1/image/assets/TEMP/cac9e3a71b396a6472a3e5f806d1e5bbccbd5400a3c79f883104106b78d34fb1?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=100 100w, https://cdn.builder.io/api/v1/image/assets/TEMP/cac9e3a71b396a6472a3e5f806d1e5bbccbd5400a3c79f883104106b78d34fb1?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=200 200w, https://cdn.builder.io/api/v1/image/assets/TEMP/cac9e3a71b396a6472a3e5f806d1e5bbccbd5400a3c79f883104106b78d34fb1?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=400 400w, https://cdn.builder.io/api/v1/image/assets/TEMP/cac9e3a71b396a6472a3e5f806d1e5bbccbd5400a3c79f883104106b78d34fb1?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=800 800w, https://cdn.builder.io/api/v1/image/assets/TEMP/cac9e3a71b396a6472a3e5f806d1e5bbccbd5400a3c79f883104106b78d34fb1?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=1200 1200w, https://cdn.builder.io/api/v1/image/assets/TEMP/cac9e3a71b396a6472a3e5f806d1e5bbccbd5400a3c79f883104106b78d34fb1?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=1600 1600w, https://cdn.builder.io/api/v1/image/assets/TEMP/cac9e3a71b396a6472a3e5f806d1e5bbccbd5400a3c79f883104106b78d34fb1?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=2000 2000w, https://cdn.builder.io/api/v1/image/assets/TEMP/cac9e3a71b396a6472a3e5f806d1e5bbccbd5400a3c79f883104106b78d34fb1?apiKey=8ed03c2ea308415ab0f4baf5adb83802&"
              className="aspect-[1.07] object-contain object-center w-full overflow-hidden grow max-md:max-w-full max-md:mt-10"
            />
          </div>
          <div className="flex flex-col items-stretch w-[46%] ml-5 max-md:w-full max-md:ml-0">
            <div className="flex flex-col items-stretch my-auto max-md:max-w-full max-md:mt-10">
              <div className="text-zinc-900 text-4xl font-bold tracking-tighter max-md:max-w-full">
                <span className="font-medium leading-[48.409088134765625px] text-violet-600">
                  Import
                </span>
                <span className="font-medium"> your </span>
                <span className="font-medium text-violet-600">
                  Bank Statements
                </span>
                <span className="font-medium">
                  {" "}
                  directly using Excel or XML
                </span>
              </div>
              <div className="text-zinc-700 text-xl leading-8 mt-9 max-md:max-w-full">
                Forget about register manually all your bills and incomes. Just
                download your bank statements and automatize the power of
                Gastify.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="self-stretch flex w-full flex-col items-stretch mt-32 mb-11 px-9 max-md:max-w-full max-md:my-10 max-md:px-5">
        <div className="max-md:max-w-full">
          <div className="gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0">
            <div className="flex flex-col items-stretch w-[56%] max-md:w-full max-md:ml-0">
              <img
                loading="lazy"
                srcSet="https://cdn.builder.io/api/v1/image/assets/TEMP/72c6265dd7735969e6293eb7d8509368be48c4b84d43f0adbafc855b16aaf34c?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=100 100w, https://cdn.builder.io/api/v1/image/assets/TEMP/72c6265dd7735969e6293eb7d8509368be48c4b84d43f0adbafc855b16aaf34c?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=200 200w, https://cdn.builder.io/api/v1/image/assets/TEMP/72c6265dd7735969e6293eb7d8509368be48c4b84d43f0adbafc855b16aaf34c?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=400 400w, https://cdn.builder.io/api/v1/image/assets/TEMP/72c6265dd7735969e6293eb7d8509368be48c4b84d43f0adbafc855b16aaf34c?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=800 800w, https://cdn.builder.io/api/v1/image/assets/TEMP/72c6265dd7735969e6293eb7d8509368be48c4b84d43f0adbafc855b16aaf34c?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=1200 1200w, https://cdn.builder.io/api/v1/image/assets/TEMP/72c6265dd7735969e6293eb7d8509368be48c4b84d43f0adbafc855b16aaf34c?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=1600 1600w, https://cdn.builder.io/api/v1/image/assets/TEMP/72c6265dd7735969e6293eb7d8509368be48c4b84d43f0adbafc855b16aaf34c?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=2000 2000w, https://cdn.builder.io/api/v1/image/assets/TEMP/72c6265dd7735969e6293eb7d8509368be48c4b84d43f0adbafc855b16aaf34c?apiKey=8ed03c2ea308415ab0f4baf5adb83802&"
                className="aspect-[1.42] object-contain object-center w-full overflow-hidden grow max-md:max-w-full max-md:mt-10"
              />
            </div>
            <div className="flex flex-col items-stretch w-[44%] ml-5 max-md:w-full max-md:ml-0">
              <div className="flex flex-col items-stretch my-auto max-md:max-w-full max-md:mt-10">
                <div className="text-zinc-900 text-4xl font-bold tracking-tighter max-md:max-w-full">
                  <span className="font-medium leading-[48.409088134765625px] text-violet-600">
                    Get all
                  </span>
                  <span className="font-medium"> your </span>
                  <span className="font-medium text-violet-600">
                    cash movements{" "}
                  </span>
                  <span className="font-medium">
                    in customizable charts. Don’t forget anything!
                  </span>
                </div>
                <div className="text-zinc-700 text-xl leading-8 mt-7 max-md:max-w-full">
                  Analyze your cash flow with responsive and dynamic charts.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="self-center w-full max-w-[1276px] mt-24 max-md:max-w-full max-md:mt-10">
          <div className="gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0">
            <div className="flex flex-col items-stretch w-[44%] max-md:w-full max-md:ml-0">
              <div className="flex flex-col items-stretch my-auto max-md:max-w-full max-md:mt-10">
                <div className="text-violet-600 text-5xl font-bold tracking-tighter max-md:max-w-full max-md:text-4xl">
                  <span className="font-medium leading-[60.5113639831543px] text-violet-600">
                    Ready to take the control over your finances?
                  </span>{" "}
                </div>
                <div className="text-zinc-700 text-xl leading-8 mt-9 max-md:max-w-full">
                  In less than a minute you’ll be ready to use the app.
                  Register!
                </div>
                <Link href="/register" 
                    className="text-zinc-700 text-center text-base font-bold leading-8 uppercase items-stretch border-[color:var(--Alert-Content-Header,#1B1C20)] bg-white justify-center mt-9 px-6 py-4 rounded-xl border-[0.628px] border-solid max-md:max-w-full max-md:px-5">
                  REGISTER ME ❤️
                </Link>
              </div>
            </div>
            <div className="flex flex-col items-stretch w-[56%] ml-5 max-md:w-full max-md:ml-0">
              <img
                loading="lazy"
                srcSet="https://cdn.builder.io/api/v1/image/assets/TEMP/b72bcdb2fcb91a5d8ad1672ebda63b3a4d7e935c47ddc87407cdbe597428b76a?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=100 100w, https://cdn.builder.io/api/v1/image/assets/TEMP/b72bcdb2fcb91a5d8ad1672ebda63b3a4d7e935c47ddc87407cdbe597428b76a?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=200 200w, https://cdn.builder.io/api/v1/image/assets/TEMP/b72bcdb2fcb91a5d8ad1672ebda63b3a4d7e935c47ddc87407cdbe597428b76a?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=400 400w, https://cdn.builder.io/api/v1/image/assets/TEMP/b72bcdb2fcb91a5d8ad1672ebda63b3a4d7e935c47ddc87407cdbe597428b76a?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=800 800w, https://cdn.builder.io/api/v1/image/assets/TEMP/b72bcdb2fcb91a5d8ad1672ebda63b3a4d7e935c47ddc87407cdbe597428b76a?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=1200 1200w, https://cdn.builder.io/api/v1/image/assets/TEMP/b72bcdb2fcb91a5d8ad1672ebda63b3a4d7e935c47ddc87407cdbe597428b76a?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=1600 1600w, https://cdn.builder.io/api/v1/image/assets/TEMP/b72bcdb2fcb91a5d8ad1672ebda63b3a4d7e935c47ddc87407cdbe597428b76a?apiKey=8ed03c2ea308415ab0f4baf5adb83802&width=2000 2000w, https://cdn.builder.io/api/v1/image/assets/TEMP/b72bcdb2fcb91a5d8ad1672ebda63b3a4d7e935c47ddc87407cdbe597428b76a?apiKey=8ed03c2ea308415ab0f4baf5adb83802&"
                className="aspect-[1.17] object-contain object-center w-full overflow-hidden grow max-md:max-w-full max-md:mt-10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
  )
}
