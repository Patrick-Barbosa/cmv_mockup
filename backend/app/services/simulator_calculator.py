def round_value(value: float, decimals: int = 2) -> float:
    return round(value, decimals)


def calculate_new_price(current_price: float, change_type: str, change_value: float) -> float:
    if change_type == "percentual":
        return current_price * (1 + change_value / 100)
    return change_value


def format_change_applied(old_price: float, new_price: float, change_type: str) -> str:
    diff = new_price - old_price
    diff_percent = (diff / old_price * 100) if old_price > 0 else 0
    if change_type == "percentual":
        return f"{diff_percent:+.1f}% ({old_price:.2f} -> {new_price:.2f})"
    return f"R$ {diff:+.2f} ({old_price:.2f} -> {new_price:.2f})"
