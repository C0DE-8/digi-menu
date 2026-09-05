import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiArrowRight,
  FiChevronDown,
  FiSearch,
  FiMapPin,
  FiClock,
  FiGrid,
  FiSmartphone,
  FiShoppingBag,
} from "react-icons/fi";
import api from "../../api/client";
import { resolveAssetUrl } from "../../api/assets";

const cuisines = [
  "All food",
  "Rice",
  "Grills",
  "Breakfast",
  "Cafe",
  "Seafood",
  "Healthy",
  "Pastries",
];
const photos = ["shared-table", "fresh-bowl", "from-the-grill"];
const photo = (id) => `/images/${id}.jpg`;
const cities = [
  "All areas",
  "Lagos",
  "Lekki",
  "Victoria Island",
  "Ikoyi",
  "Ikeja",
  "Yaba",
  "Surulere",
  "Ajah",
  "Maryland",
  "Gbagada",
  "Magodo",
  "Festac",
  "Abuja",
  "Wuse",
  "Garki",
  "Maitama",
  "Asokoro",
  "Port Harcourt",
  "GRA Port Harcourt",
  "Kano",
  "Ibadan",
  "Enugu",
  "Abeokuta",
  "Benin City",
  "Uyo",
  "Owerri",
  "Calabar",
  "Kaduna",
];

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [areaInput, setAreaInput] = useState("All areas");
  const [areaOpen, setAreaOpen] = useState(false);
  const [cuisine, setCuisine] = useState("All food");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .get("/public/restaurants", {
          signal: controller.signal,
          params: {
            search: query.trim(),
            area,
            cuisine: cuisine === "All food" ? "" : cuisine,
          },
        })
        .then(({ data }) => setRestaurants(data.restaurants || []))
        .catch((err) => {
          if (!controller.signal.aborted) {
            setRestaurants([]);
            setError(
              err.response?.data?.error ||
                "We couldn’t load the restaurants. Please try again.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, area, cuisine, retry]);
  const areaSuggestions = cities
    .filter((city) => city.toLowerCase().includes(areaInput.toLowerCase()))
    .slice(0, 8);
  function chooseArea(city) {
    setArea(city === "All areas" ? "" : city);
    setAreaInput(city);
    setAreaOpen(false);
  }
  return (
    <main className="discovery-page">
      <section className="discovery-hero">
        <div className="discovery-copy">
          <p className="eyebrow">
            <span className="live-dot" /> Good food. Great company.
          </p>
          <h1>
            Your next
            <br />
            “this is <em>so good.</em>”
          </h1>
          <p className="hero-description">
            Local favourites. New cravings. Discover a restaurant, explore its
            menu, and make your next meal a good one.
          </p>
          <form
            className="discovery-search"
            onSubmit={(event) => {
              event.preventDefault();
              document
                .getElementById("restaurants")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            <FiSearch aria-hidden="true" />
            <input
              aria-label="Find food or restaurants"
              placeholder="What are you craving?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" className="primary-button">
              Find food <FiArrowRight />
            </button>
          </form>
          <div className="hero-footnote">
            <FiMapPin /> Discover food in Lagos <span>•</span> Order directly
            from restaurants
          </div>
        </div>
        <div className="discovery-collage">
          <div className="collage-orbit orbit-one" aria-hidden="true" />
          <div className="collage-orbit orbit-two" aria-hidden="true" />
          <img
            className="hero-food-main"
            src={photo(photos[0])}
            alt="A generous spread of freshly prepared food"
            fetchPriority="high"
          />
          <div className="hero-food-side">
            <img src={photo(photos[1], 450)} alt="Fresh colourful salad bowl" />
            <img
              src={photo(photos[2], 450)}
              alt="Skewers fresh from the grill"
            />
          </div>
          <div className="food-caption">
            <span className="caption-icon">
              <FiShoppingBag />
            </span>
            <div>
              <strong>A little discovery. A lot of flavour.</strong>
              <span>Your table, your takeaway, your choice.</span>
            </div>
          </div>
          <span className="hero-stamp">
            MADE FOR
            <br />
            <strong>food people.</strong>
          </span>
        </div>
      </section>
      <div className="discovery-ticker" aria-label="Platform features">
        <span>LOCAL FLAVOURS</span>
        <span>✳</span>
        <span>MENUS AT YOUR FINGERTIPS</span>
        <span>✳</span>
        <span>STRAIGHT FROM THE KITCHEN</span>
        <span>✳</span>
        <span>YOUR NEXT FAVOURITE</span>
      </div>
      <section className="directory-section" id="restaurants">
        <div className="directory-heading">
          <div>
            <p className="eyebrow">Follow your appetite</p>
            <h2>
              Find your kind of food<span>.</span>
            </h2>
          </div>
          <div className="area-select custom-area-select">
            <FiMapPin />
            <input
              aria-label="Restaurant area"
              aria-expanded={areaOpen}
              aria-controls="area-suggestions"
              role="combobox"
              value={areaInput}
              onFocus={() => setAreaOpen(true)}
              onBlur={() => setTimeout(() => setAreaOpen(false), 120)}
              onChange={(event) => {
                const next = event.target.value;
                setAreaInput(next);
                setArea(next === "All areas" ? "" : next);
                setAreaOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && areaSuggestions[0]) {
                  event.preventDefault();
                  chooseArea(areaSuggestions[0]);
                }
                if (event.key === "Escape") setAreaOpen(false);
              }}
            />
            <button
              type="button"
              aria-label="Show areas"
              onClick={() => setAreaOpen((open) => !open)}
            >
              <FiChevronDown />
            </button>
            {areaOpen ? (
              <div className="area-suggestions" id="area-suggestions">
                {areaSuggestions.length ? (
                  areaSuggestions.map((city) => (
                    <button
                      type="button"
                      key={city}
                      className={city === areaInput ? "active" : ""}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseArea(city)}
                    >
                      {city}
                    </button>
                  ))
                ) : (
                  <span>No city match</span>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <div className="food-filters" aria-label="Filter by cuisine">
          {cuisines.map((c) => (
            <button
              type="button"
              aria-pressed={cuisine === c}
              className={cuisine === c ? "selected" : ""}
              key={c}
              onClick={() => setCuisine(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="directory-count">
          {loading
            ? "Finding something delicious…"
            : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"} to explore`}
        </div>
        {error ? (
          <div className="directory-empty" role="alert">
            <FiSearch />
            <h3>Let’s try that again.</h3>
            <p>{error}</p>
            <button
              className="primary-button"
              onClick={() => setRetry(retry + 1)}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="restaurant-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="restaurant-placeholder" />
            ))}
          </div>
        ) : (
          <div className="restaurant-grid">
            {restaurants.map((r) => (
              <Link
                className="discovery-card"
                to={`/restaurants/${r.slug}`}
                key={r.slug}
              >
                <div className="discovery-card-image">
                  {r.cover_url ? (
                    <img
                      src={resolveAssetUrl(r.cover_url)}
                      alt={r.name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.parentElement.classList.add(
                          "image-unavailable",
                        );
                      }}
                    />
                  ) : (
                    <div className="food-image-placeholder">
                      <FiShoppingBag />
                    </div>
                  )}
                  <span
                    className={
                      r.is_open ? "restaurant-open" : "restaurant-open closed"
                    }
                  >
                    {r.is_open ? "Open now" : "Closed"}
                  </span>
                  <span className="card-arrow">
                    <FiArrowUpRight />
                  </span>
                </div>
                <div className="discovery-card-body">
                  <p className="card-cuisine">
                    {(r.cuisine_tags || []).join(" · ") || "Local kitchen"}
                  </p>
                  <h3>{r.name}</h3>
                  <p className="card-description">{r.description}</p>
                  <div className="card-meta">
                    <span>
                      <FiMapPin />{" "}
                      {r.service_area || r.address || "View location"}
                    </span>
                    {r.estimated_delivery_minutes ? (
                      <span>
                        <FiClock /> ~{r.estimated_delivery_minutes} min
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!loading && !error && !restaurants.length ? (
          <div className="directory-empty">
            <FiSearch />
            <h3>No matches. More possibilities.</h3>
            <p>Try another area or a different craving.</p>
            <button
              className="secondary-button"
              onClick={() => {
                setQuery("");
                setArea("");
                setCuisine("All food");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </section>
      <section className="how-it-works">
        <div>
          <p className="eyebrow">Less scrolling. More eating.</p>
          <h2>
            From “what’s for lunch?”
            <br />
            to “let’s eat.”
          </h2>
        </div>
        {[
          {
            icon: <FiSearch />,
            title: "Find your spot",
            text: "Explore local kitchens and discover something you’ll love.",
          },
          {
            icon: <FiSmartphone />,
            title: "Make it your meal",
            text: "Browse the menu, check prices, and build your basket.",
          },
          {
            icon: <FiShoppingBag />,
            title: "You’re good to go",
            text: "Choose pickup or delivery. Confirm with the restaurant on WhatsApp.",
          },
        ].map((item, i) => (
          <article key={item.title}>
            <span className="step-number">0{i + 1}</span>
            {item.icon}
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
      <section className="owner-invitation">
        <div className="owner-illustration" aria-hidden="true">
          <FiGrid />
          <span>
            YOUR MENU.
            <br />
            EVERYWHERE.
          </span>
        </div>
        <div>
          <p className="eyebrow">For the people behind the food</p>
          <h2>
            Big flavour.
            <br />
            Meet your new front door.
          </h2>
          <p>
            Give your business a beautiful digital menu. Share it with a QR
            code. Keep your menu and incoming orders in one place.
          </p>
          <Link className="primary-button" to="/register">
            Create your restaurant account <FiArrowUpRight />
          </Link>
          <span className="owner-note">
            Set up your menu while we review your business.
          </span>
        </div>
      </section>
    </main>
  );
}
