import Link from "next/link";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { ChevronDown, MessageCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero pt-28 pb-14 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-28">
      <div className="pattern-dots absolute inset-0 hidden opacity-40 md:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:gap-16">
          <div className="animate-fade-in lg:w-1/2">
            <div className="mb-6 flex flex-wrap gap-2">
              {["Book a table for 4 people", "I want a black T-shirt"].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 rounded-full border border-whatsapp/20 bg-whatsapp/5 px-3 py-1.5 text-xs font-medium text-whatsapp-dark"
                >
                  <MessageCircle className="h-3 w-3" />
                  {pill}
                </span>
              ))}
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]">
              Increase <span className="text-whatsapp">orders</span>,
              <br />
              get more <span className="text-whatsapp">bookings</span>,
              <br />
              and streamline
              <br />
              interactions{" "}
              <span className="relative inline-block">
                effortlessly
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path
                    d="M0 4C50 0 100 8 200 4"
                    stroke="#10D050"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-gray-500 sm:text-lg">
              Build forms without code &amp; get the data directly from the customer&apos;s
              WhatsApp numbers
            </p>

            <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-shadow focus-within:border-whatsapp focus-within:shadow-md">
                <button
                  type="button"
                  className="flex items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 py-3.5 text-sm text-gray-700"
                >
                  <span className="text-lg leading-none"><FlagIcon code="MY" className="h-4 w-5" /></span>
                  <span className="font-medium">+60</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <input
                  type="tel"
                  placeholder="12-345 6789"
                  className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <Link href="/signup" className="sm:w-auto">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp-dark px-6 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-whatsapp-deep active:scale-[0.98] sm:w-auto"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Create a Free Form
                </button>
              </Link>
            </div>

            <div className="mt-4 flex w-full max-w-md flex-col items-stretch gap-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Login with Google
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              No credit card required. No coding required.
            </p>
          </div>

          <div className="animate-fade-in relative mt-14 hidden lg:mt-0 lg:block lg:w-1/2">
            <div className="relative mx-auto w-full max-w-[540px]">
              <div className="absolute inset-0 -top-6 rounded-[2.5rem] bg-gradient-to-br from-green-50 via-gray-50 to-blue-50 opacity-60" />

              <div className="relative z-10 flex items-start justify-center gap-5">
                <div className="animate-float-gentle mt-8 w-60 shrink-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
                  <div className="mb-4 border-b border-gray-100 pb-3 text-center">
                    <span className="text-sm font-bold text-gray-800">OneForm</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Your name", val: "Alice Fox" },
                      { label: "Choose your pastry" },
                      { label: "Your delivery address", val: "#15, 5th Avenue" },
                    ].map((f, i) => (
                      <div key={i}>
                        <span className="mb-1 block text-[11px] font-medium text-gray-400">
                          {f.label}
                        </span>
                        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                          {f.val || "Select an option"}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-whatsapp-dark py-2.5 text-xs font-semibold text-white shadow-sm"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      Submit on WhatsApp
                    </button>
                  </div>
                </div>

                <div className="animate-float-gentle-delay w-64 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                  <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      AC
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Alice Customer</p>
                      <p className="text-[10px] text-gray-400">Tap here for contact info</p>
                    </div>
                  </div>
                  <div className="mb-2 rounded-lg rounded-tl-sm bg-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-700">
                    <p className="mb-1 font-semibold text-gray-900">Cake Shop</p>
                    <p>Your name: Alice Fox</p>
                    <p>Choose your pastry: Chocolate ($6.5)</p>
                    <p>Your delivery address: #15, 5th Avenue, Crossby Street</p>
                  </div>
                  <div className="ml-auto mt-3 max-w-[85%] rounded-lg rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-xs leading-relaxed text-gray-700">
                    <p>Thanks! Your order is confirmed</p>
                    <p className="mt-0.5 text-right text-[9px] text-gray-400">
                      07:18 <span className="text-blue-400">&#10003;&#10003;</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}