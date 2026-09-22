"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { META_PIXEL_ID, hasMetaPixel } from "@/lib/meta/config";
import { flushPixelQueue } from "@/lib/meta/pixel";

/**
 * Loads the Meta pixel and keeps PageView in step with client-side routing.
 *
 * The inline snippet fires the first PageView itself; App Router navigations
 * never reload the page, so every later one is sent from the effect below.
 * Renders nothing at all when NEXT_PUBLIC_META_PIXEL_ID is unset.
 */
export function MetaPixel() {
  const pathname = usePathname();
  // The snippet already counted the landing page — don't double it.
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!hasMetaPixel) return null;

  return (
    <>
      {/* onReady fires once the snippet has defined fbq — the moment any
          event raised during hydration can finally be sent. */}
      <Script id="meta-pixel" strategy="afterInteractive" onReady={flushPixelQueue}>
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
      </Script>
      {/* Counts the landing page for visitors with JavaScript disabled, who
          would otherwise be invisible to the pixel entirely. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
