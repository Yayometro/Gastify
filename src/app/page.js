import Image from 'next/image'
import Link from 'next/link'


export default function Home() {
  
  return (
    <main className="flex bg-stone-50 min-h-screen flex-col items-center justify-between px-1">
      <div className="bg-stone-50 flex flex-col items-center py-4">
      <div className="w-full max-w-[1218px] mt-6 max-md:max-w-full max-md:mt-10">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0">
          <div className="flex flex-col items-stretch w-[39%] max-md:w-full max-md:ml-0">
            <div className="flex flex-col px-3 max-md:max-w-full max-md:mt-10">
              
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
                  Register me ❤️
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-stretch w-[61%] ml-5 max-md:w-full max-md:ml-0">
            <img
              loading="lazy"
              src="/Laptop.png"
              className="aspect-[1.5] object-contain object-center w-full overflow-hidden grow mt-1.5 max-md:max-w-full max-md:mt-10"
            />
          </div>
        </div>
      </div>
      <div className="self-stretch flex w-full flex-col items-stretch mt-32 mb-11 px-9 max-md:max-w-full max-md:my-10 max-md:px-5">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0">
          <div className="flex flex-col items-stretch w-[54%] max-md:w-full max-md:ml-0">
            <img
              loading="lazy"
              srcSet="/Excel.png"
              className="aspect-[1.07] object-contain object-center w-full overflow-hidden grow max-md:max-w-full max-md:mt-10 rounded-xl"
            />
          </div>
          <div className="flex flex-col items-stretch w-[46%] ml-5 max-md:w-full max-md:ml-0">
            <div className="flex flex-col items-stretch my-auto max-md:max-w-full max-md:mt-10 px-4">
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
                srcSet="/customChart.png"
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
                srcSet='/finalImg.png'
                className="aspect-[1.17] object-contain object-center w-full overflow-hidden grow max-md:max-w-full max-md:mt-10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer className='w-full h-full bg-stone-100 flex flex-col justify-center items-center text-sm text-center gap-4 pt-16 px-4 pb-[100px] min-[640px]:px-[100px]'>
      <p>© 2014 Gastify</p>
      <p>All rights reserved by Gastify</p>
      <p>Gastify is a trademark and intellectual property of Jair Vázquez</p>
      <p>All information shared with Gastify is securely stored in our database and sensitive information is not accessible to us or any third party seeking to use it.</p>
      <a href='https://www.linkedin.com/in/luisjairvazquezn/'>
        <p className=' underline text-purple-500'>Contact us</p>
      </a>
    </footer>
    </main>
  )
}
