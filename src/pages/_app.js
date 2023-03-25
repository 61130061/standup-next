import "../styles/globals.css";
import { useState, useEffect } from "react";

function MyApp({ Component, pageProps }) {
  const [liffObject, setLiffObject] = useState(null);
  const [liffError, setLiffError] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [devToken, setDevToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY2Vzcy5saW5lLm1lIiwic3ViIjoiVTEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwYWJjZGVmICIsImF1ZCI6IjEyMzQ1Njc4OTAiLCJleHAiOjE1MDQxNjkwOTIsImlhdCI6MTUwNDI2MzY1Nywibm9uY2UiOiIwOTg3NjU0YXNkZiIsImFtciI6WyJwd2QiXSwibmFtZSI6IlRhcm8gTGluZSIsInBpY3R1cmUiOiJodHRwczovL3NhbXBsZV9saW5lLm1lL2FCY2RlZmcxMjM0NTYifQ.ZWq-gAvJoxdt9BU9xIcaLP5ZzyDjqO9mMTkKmVraRLo');

  // Execute liff.init() when the app is initialized
  useEffect(() => {
    // to avoid `window is not defined` error
    import("@line/liff").then((liff) => {
      console.log("LIFF init...");
      liff
        .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID })
        .then(() => {
          console.log("LIFF init succeeded.");

          const token = liff.getIDToken();
          setIdToken(token);

          setLiffObject(liff);
        })
        .catch((error) => {
          console.log("LIFF init failed.");
          setLiffError(error.toString());
        });
    });
  }, []);

  // Provide `liff` object and `liffError` object
  // to page component as property
  pageProps.liff = liffObject;
  pageProps.liffError = liffError;
  pageProps.idToken = idToken;
  pageProps.devToken = devToken;
  return <Component {...pageProps} />;
}

export default MyApp;
