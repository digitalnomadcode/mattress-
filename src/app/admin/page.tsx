import {redirect} from "next/navigation";
import {requireAdmin} from "@/server/auth";
import {getAdminData} from "@/server/admin-data";
import {AdminDashboard} from "@/components/admin-dashboard";
import {BusinessError} from "@/server/errors";
export default async function AdminPage(){let actor;try{actor=await requireAdmin();}catch(e){if(e instanceof BusinessError&&e.status===401)redirect("/admin/login");throw e;}const data=await getAdminData(actor);return <AdminDashboard initial={JSON.parse(JSON.stringify(data))}/>;}
