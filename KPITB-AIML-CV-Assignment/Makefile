PYTHON ?= python3
VENV ?= .venv
BIN := $(VENV)/bin

.PHONY: setup lint format-check typecheck test smoke check clean

setup:
	$(PYTHON) -m venv $(VENV)
	$(BIN)/python -m pip install --upgrade pip
	$(BIN)/python -m pip install --require-hashes -r requirements.lock
	$(BIN)/python -m pip install --no-build-isolation --no-deps -e .

lint:
	$(BIN)/ruff check src tests

format-check:
	$(BIN)/ruff format --check src tests

typecheck:
	$(BIN)/mypy src tests

test:
	$(BIN)/pytest

smoke:
	$(BIN)/python -c "from visionshield.contracts import ObjectClass; assert len(ObjectClass) == 4"

check: lint format-check typecheck test smoke

clean:
	rm -rf .coverage .mypy_cache .pytest_cache .ruff_cache htmlcov
