"use client";
import {useState,type FormEvent} from "react";
import {signIn} from "next-auth/react";
import Link from "next/link";
import {useRouter} from "next/navigation";
export default function Login(){const router=useRouter();const [locale,setLocale]=useState<"ru"|"kk">("kk");const [error,setError]=useState(false);const [busy,setBusy]=useState(false);const kk=locale==="kk";
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError(false);setBusy(true);const f=new FormData(e.currentTarget);try{const result=await signIn("credentials",{email:f.get("email"),password:f.get("password"),redirect:false,callbackUrl:"/admin"});if(result?.ok){router.push("/admin");router.refresh();}else setError(true);}catch{setError(true);}finally{setBusy(false);}}
 return <main className="admin-login"><Link href={`/${locale}`} className="login-brand">Velora</Link><div className="login-languages"><button onClick={()=>setLocale("kk")} aria-pressed={kk}>ҚАЗ</button><button onClick={()=>setLocale("ru")} aria-pressed={!kk}>РУС</button></div><h1>{kk?"Әкімші панелі":"Панель администратора"}</h1><form onSubmit={submit}><label>Email<input type="email" name="email" required autoComplete="username"/></label><label>{kk?"Құпиясөз":"Пароль"}<input type="password" name="password" required maxLength={200} autoComplete="current-password"/></label>{error&&<p role="alert" className="form-error">{kk?"Email немесе құпиясөз қате. Кейінірек қайта кіріп көріңіз.":"Неверный email или пароль. Попробуйте позже."}</p>}<button className="button primary" disabled={busy}>{busy?"…":kk?"Кіру":"Войти"}</button></form></main>;
}
