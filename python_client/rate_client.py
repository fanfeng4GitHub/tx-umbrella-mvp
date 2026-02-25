import time
import requests


def get_premium(
    base_url: str,
    api_key: str,
    coverage_amount: float,
    location_count: int,
    timeout: int = 20,
    retries: int = 3,
    backoff_seconds: float = 1.0,
):
    """
    Calls /api/rate and returns premium response dict.

    Raises:
        ValueError: for bad inputs
        RuntimeError: for API/HTTP failures after retries
    """
    if coverage_amount <= 0:
        raise ValueError("coverage_amount must be > 0")
    if location_count < 1:
        raise ValueError("location_count must be >= 1")

    url = f"{base_url.rstrip('/')}/api/rate"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
    }
    payload = {
        "coverageAmount": coverage_amount,
        "locationCount": location_count,
    }

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=timeout)

            # Retry on transient server issues
            if resp.status_code in (500, 502, 503, 504):
                raise RuntimeError(f"Transient server error: {resp.status_code} {resp.text}")

            if resp.status_code == 401:
                raise RuntimeError("Unauthorized: check RATE_API_KEY")

            if resp.status_code >= 400:
                try:
                    detail = resp.json()
                except Exception:
                    detail = resp.text
                raise RuntimeError(f"API error {resp.status_code}: {detail}")

            data = resp.json()
            if "premium" not in data:
                raise RuntimeError(f"Unexpected response format: {data}")

            return data

        except (requests.Timeout, requests.ConnectionError, RuntimeError) as e:
            last_err = e
            if attempt < retries:
                sleep_for = backoff_seconds * (2 ** (attempt - 1))
                time.sleep(sleep_for)
            else:
                break

    raise RuntimeError(f"Failed to get premium after {retries} attempts: {last_err}")


if __name__ == "__main__":
    BASE_URL = "https://tx-umbrella-mvp.onrender.com/"
    API_KEY = "qetuo79adgjl46zcbm13"

    result = get_premium(
        base_url=BASE_URL,
        api_key=API_KEY,
        coverage_amount=1_000_000,
        location_count=3,
    )
    print("Premium:", result["premium"])
    print("Full response:", result)
