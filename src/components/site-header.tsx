import { NavLink } from "@/components/nav-link";
import { DATA } from "@/data/resume";
import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mb-14 flex items-center justify-between sm:mb-20">
      <Link href="/" aria-label={`${DATA.name}, home`} className="block rounded-full">
        <span className="relative block size-8 overflow-hidden rounded-full">
          <Image
            src={DATA.avatarUrl}
            alt=""
            fill
            priority
            sizes="32px"
            className="object-cover"
          />
        </span>
      </Link>
      <nav aria-label="Main" className="flex items-center gap-5">
        {DATA.navbar.map((route) => (
          <NavLink key={route.href} href={route.href}>
            {route.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
