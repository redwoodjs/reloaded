export default function Breadcrums(props: { breadcrums: { name: string, href: string }[] }) {
    return (
        <nav className="flex flex-row items-center justify-start gap-4 w-full" aria-label="Breadcrumb">
            <ol className="inline-flex items-center my-4">
                {props.breadcrums.map((breadcrum, index) => <li key={index} className="inline-flex items-center">
                    <a href={breadcrum.href} className="text-sm font-bold text-gray-500 hover:text-gray-800">{breadcrum.name}</a>
                    {index < props.breadcrums.length - 1 && <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                    </svg>}
                </li>)}     
            </ol>
        </nav>
    );
}

