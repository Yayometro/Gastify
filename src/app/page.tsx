import React from "react";
import Link from "next/link";
import { serverT } from "@/i18n/server";

export default async function Home() {
  const tr = await serverT(["inicio"]);
  const t = await serverT(["inicio"]);
  return (
    <main className="flex bg-gf-bg min-h-screen flex-col items-center justify-between px-1">
      <nav className=" w-full px-2 pt-1 pb-1 flex justify-between items-center">
        <div className="nav-logo w-[80px] h-[60px] sm:w-[100px] sm:h-[80px] md:w-[130px] md:h-[100px]">
          <Link
            href="/"
            >
          <img
            loading="lazy"
            src="/oficial/Gastify-full-white.PNG"
            alt={t("inicio.brand")}
            className="w-full h-full"
          />
            </Link>
        </div>
        <div className="nav-elements flex gap-6 text-gf-text">
          <Link
            href="/register"
            className="text-base leading-8 uppercase items-stretch hover:text-purple-300"
          >
            {t("inicio.cta.register")}
          </Link>
          <Link
            href="/login"
            className="text-base leading-8 uppercase items-stretch hover:text-purple-300"
          >
            {tr("inicio.nav.login")}
          </Link>
        </div>
      </nav>
      <div className="bg-gf-bg flex flex-col items-center py-4">
        <div className="w-full max-w-[1218px] mt-6 max-md:max-w-full max-md:mt-10">
          <div className="gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0">
            <div className="flex flex-col items-stretch w-[39%] max-md:w-full max-md:ml-0">
              <div className="flex flex-col px-3 max-md:max-w-full max-md:mt-10">
                <div className="text-gf-text text-5xl font-bold tracking-tighter self-stretch mt-7 max-md:max-w-full max-md:text-4xl">
                  <span className="font-medium leading-[60.5113639831543px] text-violet-600">
                    {t("inicio.hero.discover")}
                  </span>
                  <span className="font-medium"> {t("inicio.hero.spendingHabits")} </span>
                  <span className="font-medium text-violet-600">{t("inicio.hero.time")}</span>
                </div>
                <div className="text-gf-text-muted text-xl leading-8 self-stretch mt-9 max-md:max-w-full">
                  {t("inicio.hero.intro")}
                </div>
                <div className="self-stretch flex items-stretch justify-between gap-5 mt-9 max-md:max-w-full max-md:flex-wrap">
                  <Link
                    href="/login"
                    className="text-gf-text-muted text-base font-bold leading-8 uppercase items-stretch border-gf-border bg-gf-surface grow justify-center px-6 py-4 rounded-xl border-[0.628px] border-solid max-md:px-5"
                  >
                    <p>{t("inicio.cta.login")}</p>
                  </Link>
                  <Link
                    href="/register"
                    className="text-gf-text-muted text-base font-bold leading-8 uppercase items-stretch border-gf-border bg-gf-surface grow justify-center px-6 py-4 rounded-xl border-[0.628px] border-solid max-md:px-5"
                  >
                    {t("inicio.cta.registerHeart")}
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch w-[61%] ml-5 max-md:w-full max-md:ml-0">
              <img
                loading="lazy"
                src="/Laptop.png"
            alt={t("inicio.alt.dashboard")}
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
            alt={t("inicio.alt.import")}
                className="aspect-[1.07] object-contain object-center w-full overflow-hidden grow max-md:max-w-full max-md:mt-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col items-stretch w-[46%] ml-5 max-md:w-full max-md:ml-0">
              <div className="flex flex-col items-stretch my-auto max-md:max-w-full max-md:mt-10 px-4">
                <div className="text-gf-text text-4xl font-bold tracking-tighter max-md:max-w-full">
                  <span className="font-medium leading-[48.409088134765625px] text-violet-600">
                    {t("inicio.feature.import")}
                  </span>
                  <span className="font-medium"> {tr("inicio.charts.your")} </span>
                  <span className="font-medium text-violet-600">
                    {t("inicio.feature.bankStatements")}
                  </span>
                  <span className="font-medium">
                    {t("inicio.feature.directly", {  })}
                  </span>
                </div>
                <div className="text-gf-text-muted text-xl leading-8 mt-9 max-md:max-w-full">
                  {t("inicio.feature.forget")}
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
            alt={t("inicio.alt.charts")}
                  className="aspect-[1.42] object-contain object-center w-full overflow-hidden grow max-md:max-w-full max-md:mt-10"
                />
              </div>
              <div className="flex flex-col items-stretch w-[44%] ml-5 max-md:w-full max-md:ml-0">
                <div className="flex flex-col items-stretch my-auto max-md:max-w-full max-md:mt-10">
                  <div className="text-gf-text text-4xl font-bold tracking-tighter max-md:max-w-full">
                    <span className="font-medium leading-[48.409088134765625px] text-violet-600">
                      {t("inicio.charts.getAll")}
                    </span>
                    <span className="font-medium"> {tr("inicio.charts.your")} </span>
                    <span className="font-medium text-violet-600">
                      {t("inicio.charts.cashMovements", {  })}
                    </span>
                    <span className="font-medium">
                      {t("inicio.charts.customizable")}
                    </span>
                  </div>
                  <div className="text-gf-text-muted text-xl leading-8 mt-7 max-md:max-w-full">
                    {t("inicio.charts.analyze")}
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
                      {t("inicio.cta.readyTitle")}
                    </span>{" "}
                  </div>
                  <div className="text-gf-text-muted text-xl leading-8 mt-9 max-md:max-w-full">
                    {t("inicio.cta.readyText")}
                  </div>
                  <Link
                    href="/register"
                    className="text-gf-text-muted text-center text-base font-bold leading-8 uppercase items-stretch border-gf-border bg-gf-surface justify-center mt-9 px-6 py-4 rounded-xl border-[0.628px] border-solid max-md:max-w-full max-md:px-5"
                  >
                    {t("inicio.cta.registerBig")}
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-stretch w-[56%] ml-5 max-md:w-full max-md:ml-0">
                <img
                  loading="lazy"
                  srcSet="/finalImg.png"
            alt={t("inicio.devices.title")}
                  className="aspect-[1.17] object-contain object-center w-full overflow-hidden grow max-md:max-w-full max-md:mt-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full h-full bg-gf-surface flex flex-col justify-center items-center text-sm text-center gap-4 pt-16 px-4 pb-[100px] min-[640px]:px-[100px]">
        <p>{t("inicio.footer.copyright", { p1: new Date().getFullYear() })}</p>
        <p>{t("inicio.footer.rights")}</p>
        <p>{t("inicio.footer.trademark")}</p>
        <p>
          {t("inicio.footer.privacy")}
        </p>
        <a href="https://www.linkedin.com/in/luisjairvazquezn/">
          <p className=" underline text-purple-500">{t("inicio.footer.contact")}</p>
        </a>
      </footer>
    </main>
  );
}
