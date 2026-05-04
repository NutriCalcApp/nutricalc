/* eslint-disable */
import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Html5Qrcode } from "html5-qrcode";
let _lang = localStorage.getItem("nc2-lang")||"it";
const API_BASE = typeof window !== "undefined" && (window.Capacitor || window.location.protocol === "file:") ? "https://nutricalc-nine.vercel.app" : "";