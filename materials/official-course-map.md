# Official course map - learn-timeseries-forecasting-with-phoebe

**Course:** Time-series forecasting - predicting what a number does next, end to end
**Scope:** The full picture of forecasting: the shape of a series (trend, seasonality, noise, level), the method ladder (baselines -> exponential smoothing/ETS -> ARIMA/SARIMA -> Prophet -> ML/gradient-boosting -> deep), how a forecast is measured and backtested, the team + pipeline / R&R (analyst profiles history -> data scientist models -> ML eng serves -> monitor drift), the tech implementation (real Python), and the strategy/pitfalls. Explained for the layman with a visual per concept, and for the practitioner with real code.
**Arc:** Topic-session, two-track, with a running series **Lumen web analytics** (the Lumen skincare brand from the Statistics + Intro-ML courses, now forecasting its site's daily sessions + signups) so the DS ladder stays continuous. Leader track (a1-a6, PM/biz/product leaders) + builder track (b1-b10, analysts / data scientists / engineers).
**Bucket:** `ds` (Data Science). Palette: forecast green `#16A34A` + slate.
**Coverage bar:** ~80% of the mapped sources' working content per session; the open textbook (FPP3) and papers stay official (cited).
**Build mode:** course-taking loop PAUSED (built direct from verified sources, no learner-notes step).

## Source universe (verified public sources, with citations)

| Source | What it covers | Maps to |
|---|---|---|
| **Hyndman & Athanasopoulos, "Forecasting: Principles and Practice" (3rd ed, FPP3), OTexts, https://otexts.com/fpp3/** (open textbook) | the canon: decomposition (STL), baselines, exponential smoothing/ETS, ARIMA/SARIMA, evaluation, backtesting (time-series cross-validation) | a2, a3, a5, b1, b2, b3, b4, b8 |
| **Box & Jenkins (1970), "Time Series Analysis: Forecasting and Control"** | ARIMA / the Box-Jenkins method: stationarity, differencing, ACF/PACF, model orders | a3, b4 |
| **Taylor & Letham (2018), "Forecasting at Scale" (Prophet), The American Statistician 72(1):37-45, DOI 10.1080/00031305.2017.1380080; PeerJ Preprints 5:e3190 (2017)** | Prophet: decomposable trend + seasonality + holidays, analyst-friendly | a3, b5 |
| **Salinas et al. (2020), "DeepAR: Probabilistic forecasting with autoregressive recurrent networks," Int. J. Forecasting 36(3):1181-1191; arXiv:1704.04110** | deep probabilistic forecasting; RNN, quantile outputs at scale | a3, b7 |
| **Oreshkin et al. (2020), "N-BEATS: Neural basis expansion analysis for interpretable time series forecasting," ICLR 2020, arXiv:1905.10437** | pure deep-learning forecaster, interpretable basis | b7 |
| **Lim et al. (2021), "Temporal Fusion Transformers for interpretable multi-horizon time series forecasting," Int. J. Forecasting 37(4):1748-1764; arXiv:1912.09363** | attention-based multi-horizon forecasting | b7 |
| **M-competitions (Makridakis et al., M4 2018 / M5 2020)** | empirical evidence: simple methods + combinations are hard to beat; ML/hybrid rise in M5 | a3, a5, a6, b6 |
| **scikit-learn / gradient boosting (XGBoost, LightGBM) docs** | forecasting-as-regression: lag/rolling/calendar features | b6 |

## Layman anchors (verified, cite on landing / a1)

- Forecasting is everywhere a business plans ahead: demand/inventory, staffing, cash-flow, capacity, web traffic. Getting it wrong is expensive both ways (stockouts vs dead stock).
- FPP3 (Hyndman) is the free, authoritative open textbook - the honest backbone of this course.
- The M-competitions repeatedly show a **simple baseline is hard to beat** and that combining methods wins - the course's central humility lesson.

## Per-session coverage

### Leader track (a1-a6) - PM / biz / product leaders, no code
| # | Session | Primary sources | Coverage |
|---|---|---|---|
| a1 | Why forecast | industry, FPP3 intro | ✓ where forecasting pays off, the two-sided cost of error |
| a2 | The shape of a series (plain English) | FPP3 (decomposition) | ✓ trend, seasonality, cycle, noise, level - visual-heavy |
| a3 | The methods, without math | FPP3, Box-Jenkins, Prophet, deep, M-comps | ✓ the ladder baselines -> smoothing -> ARIMA -> Prophet -> ML/deep |
| a4 | The team + the pipeline (R&R) | industry practice | ✓ analyst -> DS -> ML eng/devops -> monitoring |
| a5 | Measuring a forecast | FPP3 (eval), M-comps | ✓ MAPE/RMSE/MASE, backtesting, beat-the-naive, prediction intervals |
| a6 | Strategy & pitfalls | FPP3, M-comps, practice | ◐ horizon, leakage, over-fitting, cold-start, when NOT to forecast |

### Builder track (b1-b10) - analysts / DS / engineers (real Python)
| # | Session | Primary sources | Coverage |
|---|---|---|---|
| b1 | Forecasting foundations | FPP3 | ✓ pandas datetime index, resample, the Lumen series, time-based train/test |
| b2 | Decomposition + baselines | FPP3 | ✓ STL decomposition, naive/seasonal-naive/drift (the lines to beat) |
| b3 | Exponential smoothing / ETS | FPP3 | ✓ SES/Holt/Holt-Winters (statsmodels) + `forecast-live.js` real demo |
| b4 | ARIMA / SARIMA | Box-Jenkins, FPP3 | ✓ stationarity, differencing, ACF/PACF, orders, auto_arima |
| b5 | Prophet | Taylor & Letham 2018 | ✓ trend + seasonality + holidays, changepoints |
| b6 | ML forecasting | sklearn/XGBoost, M5 | ✓ lag/rolling/calendar features + gradient boosting, direct vs recursive |
| b7 | Deep forecasting (survey) | DeepAR, N-BEATS, TFT | ◐ RNN/DeepAR, N-BEATS, TFT - cited, illustrative sketch (re-verify) |
| b8 | Backtesting + metrics | FPP3 | ✓ rolling-origin CV, MAPE/RMSE/MASE, prediction intervals, coverage |
| b9 | Productionizing | industry practice | ✓ retrain cadence, batch serving, the forecast API + dashboard, feature/UI |
| b10 | Monitoring | industry practice | ✓ forecast-error tracking, drift, when to retrain, the closed loop |

## Hard rails / honesty

- **Forecasts are uncertain.** Always teach a prediction interval, never a bare point. A forecast without an interval is a guess with false confidence.
- **Beat the naive baseline or do not ship.** The M-competitions show simple methods (seasonal-naive, exponential smoothing, combinations) are shockingly hard to beat; complexity must earn its place on backtested accuracy.
- **No leakage.** Never split time-series randomly; split by time. Features must use only information available at forecast time.
- **The simulator is real math on a small teaching series** (a synthetic Lumen-style series), not a production forecaster - state it.
- Deep models (DeepAR/N-BEATS/TFT) are surveyed with citations; full training belongs to a dedicated ML/deep-learning course. Re-verify b7/a3 (the deep area moves fast).

## Not covered by design (say so honestly)

- Full deep-model training from scratch (b7 is a cited survey + illustrative sketch).
- Hierarchical / reconciliation forecasting beyond a mention.
- Intermittent-demand (Croston) and full probabilistic/quantile modelling beyond intervals.
- Multivariate/VAR and causal-impact beyond a mention.
- Vendor forecast products (AWS Forecast, etc.) beyond a buy-vs-build note.

**Re-verify before delivery:** b7/a3 (deep forecasting moves fast); the "simple beats complex" M-competition framing (cite M4/M5, avoid overclaiming a single number).
