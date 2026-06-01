"use client";

import { useRef, useState } from "react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwdnJXZgCsx6tO2iyYQQuUTR3a5TjY8jG-433hGl5tqVYoAbAdbe2MQXX3rhbJLvsg8CA/exec";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: new FormData(form),
      });
      setShowAlert(true);
      form.reset();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contact-box">
      {showAlert && (
        <div className="my-alert">
          <span
            className="closebtn"
            onClick={() => setShowAlert(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setShowAlert(false)}
          >
            &times;
          </span>
          <strong>Terimakasih!</strong> Pesan anda sudah kami terima.
        </div>
      )}
      <form ref={formRef} name="submit-to-google-sheet" onSubmit={handleSubmit}>
        <div className="input-box">
          <input type="text" placeholder="Name" className="input-control" name="name" />
        </div>
        <div className="input-box">
          <input
            type="tel"
            className="input-control"
            name="phone"
            placeholder="Phone Number"
            required
          />
        </div>
        <div className="input-box">
          <input
            type="text"
            placeholder="Email"
            className="input-control"
            name="email"
            required
          />
        </div>
        <div className="input-box">
          <input
            type="text"
            placeholder="Subject"
            className="input-control"
            name="subject"
          />
        </div>
        <div className="input-box">
          <textarea
            placeholder="Message"
            className="input-control"
            name="messages"
          />
        </div>
        {!loading ? (
          <button type="submit" className="buttonload btn-kirim">
            Send Message
          </button>
        ) : (
          <button className="buttonload" type="button" disabled>
            <i className="fa fa-circle-notch fa-spin" /> Loading...
          </button>
        )}
      </form>
    </div>
  );
}
