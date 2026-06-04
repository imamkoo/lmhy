import Link from "next/link";
import { ContactForm } from "./ContactForm";
import { LandingEffects } from "./LandingEffects";

const LOGO = "/assets/logo%20let%20me%20hear%20you.jpeg";

export function LandingPage() {
  return (
    <div className="landing-page-wrapper">
      <LandingEffects />
      <div className="preloader js-preloader">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/LMHY.png" alt="preloader" />
      </div>

      <header className="header">
        <div className="container">
          <div className="header-main">
            <div className="logo">
              <Link href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/LMHY.png" alt="Let Me Hear You" />
              </Link>
            </div>
            <button type="button" className="nav-toggler js-nav-toggler" aria-label="Menu">
              <span />
            </button>
            <nav className="nav js-nav">
              <ul>
                <li style={{ "--item": 0 } as React.CSSProperties}>
                  <a href="#home">Home</a>
                </li>
                <li style={{ "--item": 1 } as React.CSSProperties}>
                  <a href="#about">About</a>
                </li>
                <li style={{ "--item": 2 } as React.CSSProperties}>
                  <a href="#services">Services</a>
                </li>
                <li style={{ "--item": 3 } as React.CSSProperties}>
                  <a href="#article">Article</a>
                </li>
                <li style={{ "--item": 4 } as React.CSSProperties}>
                  <a href="#contact">Contact</a>
                </li>
                {/* <li style={{ "--item": 5 } as React.CSSProperties}>
                  <Link href="/login">Login Admin / Member</Link>
                </li> */}
                <li style={{ "--item": 6 } as React.CSSProperties}>
                  <a href="/mental-battery" className="learn-more" style={{ display: "inline-block", marginTop: 8 }}>
                    Cek Kondisi Sekarang
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <section className="home" id="home">
        <div className="container">
          <div className="row">
            <div className="home-text">
              <h1>We Provide The Best Care For You</h1>
              <p>
                Kami adalah komunitas yang peduli dengan Kesehatan Mental,
                mendengarkan siapapun yang ingin didengartkan karena manusia hanya
                mendengar apa yang ingin mereka dengar, tapi tidak dengan kami. Kami
                siap untuk mendengarkan kalian dalam kondisi apapun.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8" style={{ zIndex: 10, position: "relative" }}>
                <a href="#contact" className="learn-more text-center">
                  Contact Us
                </a>
                <a href="/mental-battery" className="learn-more text-center">
                  Cek Mental Battery
                </a>
              </div>
            </div>
            <div className="home-img">
              <div className="fancy-br-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO} alt="Let Me Hear You" />
                <div className="icon-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/sapiens.png" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about section-padding" id="about">
        <div className="container">
          <div className="section-title">
            <h2 className="title">About Us</h2>
            <p className="sub-title">Why we are the best</p>
          </div>
          <div className="row">
            <div className="about-img">
              <div className="fancy-br-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO} alt="" />
                <div className="icon-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/sapiens-2.png" alt="" />
                </div>
              </div>
            </div>
            <div className="about-text">
              <p>
                Kami menyediakan tempat bagi Anda untuk berbagi cerita, untuk membantu
                kesehatan mental bagi generasi Indonesia yang lebih baik. Kami adalah
                Pendengar Anda dimanapun dan kapanpun Anda berada.
              </p>
              <h3>Yang Kami Tawarkan Untuk Anda</h3>
              <ul>
                <li>
                  <i className="fas fa-check" /> Mendapat konsultasi dengan mentor dan
                  konselor kami.
                </li>
                <li>
                  <i className="fas fa-check" /> Tempat berbagi cerita tanpa khawatir
                  karena kerahasiaan anda kami jaga.
                </li>
                <li>
                  <i className="fas fa-check" /> Respon cepat dan dapat dilakukan secara
                  online.
                </li>
                <li>
                  <i className="fas fa-check" /> Aplikasi wellness: skrining mandiri,
                  mood tracker, dan alat relaksasi.
                </li>
              </ul>
              <a href="/mental-battery" className="learn-more">
                Cek Kondisi Mental Sekarang
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="service section-padding" id="services">
        <div className="container">
          <div className="section-title">
            <h2 className="title">Services</h2>
            <p className="sub-title">What we provide</p>
          </div>
          <div className="row">
            {[
              { img: "1.jpg", title: "Mentoring", text: "Sharing tentang apa yang dirasa memberatkan dalam menjalani kehidupan tanpa mendapatkan penghakiman." },
              { img: "2.jpg", title: "Consultation", text: "Case yang lebih urgent dan serius akan di arahkan dan tangani oleh Psikolog handal." },
              { img: "3.jpg", title: "Sharing", text: "Mendapat sosial support dan komunitas sebagai sarana untuk berdiskusi." },
              { img: "4.jpg", title: "Online Mentoring", text: "Kelas khusus untuk modul atau webinar seputar psikologi dan kesehatan mental." },
            ].map((s) => (
              <div key={s.img} className="services-item">
                <div className="img-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/assets/img/service/${s.img}`} alt="" />
                </div>
                <div className="text">
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fun-fact">
        <div className="container">
          <div className="row">
            {[
              ["100", "Happy client"],
              ["99", "Mental health"],
              ["5", "Psikolog"],
              ["10", "Loyal clients"],
            ].map(([n, label]) => (
              <div key={label} className="fun-fact-item">
                <div className="box">
                  <h2>{n}</h2>
                  <p>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="article section-padding" id="article">
        <div className="container">
          <div className="section-title">
            <h2 className="title">Article</h2>
            <p className="sub-title">Our Article</p>
          </div>
        </div>
        <section className="cards-wrapper">
          {[
            {
              title: "Mental illness",
              tag: "Mental Illness",
              bg: "https://images.pexels.com/photos/3601097/pexels-photo-3601097.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
              excerpt:
                "Mental illness atau yang disebut juga gangguan kesehatan mental adalah istilah yang mengacu pada berbagai kondisi yang memengaruhi pemikiran ...",
            },
            {
              title: "Mental Health",
              tag: "Mental Health",
              bg: "https://images.pexels.com/photos/4100420/pexels-photo-4100420.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
              excerpt:
                "Mental Health yang baik adalah kondisi ketika batin kita berada dalam keadaan tentram dan tenang...",
            },
            {
              title: "Mental Disorder",
              tag: "Mental Disorder",
              bg: "https://images.pexels.com/photos/4098339/pexels-photo-4098339.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
              excerpt:
                "Salah satu masalah kesehatan yang penting diperhatikan oleh masyarakat adalah mental disorder...",
            },
          ].map((card) => (
            <div key={card.title} className="card-grid-space">
              <a
                className="card"
                href="#article"
                style={{ "--bg-img": `url(${card.bg})` } as React.CSSProperties}
              >
                <div>
                  <h1>{card.title}</h1>
                  <p>{card.excerpt}</p>
                  <div className="tags">
                    <div className="tag">{card.tag}</div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </section>
      </section>

      <section className="contact section-padding" id="contact">
        <div className="container">
          <div className="row">
            <div className="contact-details">
              <div className="section-title">
                <p className="sub-title">Contact Us</p>
              </div>
              <p>
                Hubungi kami melalui form yang telah disediakan, pastikan isi nomor
                telepon dan email dengan benar.
              </p>
              <div className="contact-info">
                <div className="contact-info-item">
                  <i className="fas fa-map-marked-alt" />
                  <p>
                    Ruko Puncak CBD Blok 8C APT - 8F APT, Jajar Tunggal, Kec. Wiyung,
                    Surabaya, Jawa Timur 60228
                  </p>
                </div>
                <div className="contact-info-item">
                  <i className="fas fa-envelope" />
                  <p>letmehearyou.id@gmail.com</p>
                </div>
                <div className="contact-info-item">
                  <i className="fas fa-phone" />
                  <p>+62 812 3244 5567</p>
                </div>
              </div>
              <div className="social-links">
                <a href="https://web.facebook.com/LetMeHearYouOfficial" title="facebook">
                  <i className="fab fa-facebook" />
                </a>
                <a href="https://twitter.com/LetMeHearYouID" title="twitter">
                  <i className="fab fa-twitter" />
                </a>
                <a href="https://t.me/+w1ZE8HhwKs05ODhl" title="telegram">
                  <i className="fab fa-telegram" />
                </a>
                <a href="https://discord.gg/K7MqAdNGUk" title="discord">
                  <i className="fab fa-discord" />
                </a>
                <a href="https://instagram.com/letmehearyou.id" title="instagram">
                  <i className="fab fa-instagram" />
                </a>
                <a href="https://www.youtube.com/channel/UCUTgwCC-gc6f-fHuVytTTbg" title="youtube">
                  <i className="fab fa-youtube" />
                </a>
              </div>
            </div>
            <div className="contact-form">
              <div className="icon-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/3.png" alt="" />
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-top">
          <div className="container">
            <div className="row">
              <div className="footer-item">
                <h3>About Us</h3>
                <p>
                  Kami adalah komunitas yang peduli dengan Kesehatan Mental,
                  mendengarkan siapapun yang ingin didengartkan.
                </p>
              </div>
              <div className="footer-item footer-center">
                <h3>Follow Us</h3>
                <ul>
                  <li>
                    <a href="https://web.facebook.com/LetMeHearYouOfficial">Facebook</a>
                  </li>
                  <li>
                    <a href="https://twitter.com/LetMeHearYouID">Twitter</a>
                  </li>
                  <li>
                    <a href="https://t.me/+w1ZE8HhwKs05ODhl">Telegram</a>
                  </li>
                  <li>
                    <a href="https://discord.gg/K7MqAdNGUk">Discord</a>
                  </li>
                  <li>
                    <a href="https://instagram.com/letmehearyou.id">Instagram</a>
                  </li>
                  <li>
                    <a href="https://www.youtube.com/channel/UCUTgwCC-gc6f-fHuVytTTbg">
                      Youtube
                    </a>
                  </li>
                </ul>
              </div>
              <div className="footer-item">
                <h3>App</h3>
                <ul>
                  <li>
                    <Link href="/login">Masuk Admin</Link>
                  </li>
                  {/* <li>
                    <Link href="/mental-battery/quiz">Skrining Mandiri</Link>
                  </li> */}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>
              Created by{" "}
              <a href="https://www.instagram.com/imam.ko/">imam.ko</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
