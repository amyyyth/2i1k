export default function PhoneComponent() {
    return(
        <div className="flex flex-col justify-center min-h-screen p-8 items-center">
            <p className="text-center text-6xl font-bold">
                Hello, idiot!
            </p>
            <p className="text-center text-lg mt-4">
                {/* Well, well looks like this idiot thinks that he can code on a phone! */}
                    Log in from a device with a real keyboard! The site&apos;s name literally says<br/> 2 idiots, <b>1 keyboard</b>!
            </p>
            {/* <p className="text-center text-lg mt-4">
                <i>
                    Log in from a device with a real keyboard! The site's name literally says 2 idiots, 1 keyboard!
                </i>
            </p> */}
        </div>
    )
}