"""
API для сохранения и получения маршрутов StepMap.
GET  / — список маршрутов пользователя
POST / — сохранить новый маршрут
DELETE /?id=<id> — удалить маршрут
"""
import json
import os
import psycopg2

SCHEMA = "t_p79031975_stepmap_route_tracke"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    user_id = event.get("headers", {}).get("X-User-Id", "default")

    if method == "GET":
        return get_routes(user_id)
    elif method == "POST":
        raw_body = event.get("body") or "{}"
        if isinstance(raw_body, str):
            body = json.loads(raw_body)
        else:
            body = raw_body
        if isinstance(body, str):
            body = json.loads(body)
        return save_route(user_id, body)
    elif method == "DELETE":
        params = event.get("queryStringParameters") or {}
        route_id = params.get("id")
        return delete_route(user_id, route_id)

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}


def get_routes(user_id: str) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT id, date, distance_m, elapsed_sec, points, note, created_at
        FROM {SCHEMA}.routes
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 50
        """,
        (user_id,)
    )
    rows = cur.fetchall()
    conn.close()

    routes = []
    for row in rows:
        routes.append({
            "id": row[0],
            "date": str(row[1]),
            "distance_m": row[2],
            "elapsed_sec": row[3],
            "points": row[4],
            "note": row[5] or "",
            "created_at": str(row[6]),
        })

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"routes": routes}),
    }


def save_route(user_id: str, body: dict) -> dict:
    distance_m = float(body.get("distance_m", 0))
    elapsed_sec = int(body.get("elapsed_sec", 0))
    points = body.get("points", [])
    note = body.get("note", "")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""
        INSERT INTO {SCHEMA}.routes (user_id, distance_m, elapsed_sec, points, note)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, created_at
        """,
        (user_id, distance_m, elapsed_sec, json.dumps(points), note)
    )
    row = cur.fetchone()
    conn.commit()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "id": row[0], "created_at": str(row[1])}),
    }


def delete_route(user_id: str, route_id) -> dict:
    if not route_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"DELETE FROM {SCHEMA}.routes WHERE id = %s AND user_id = %s",
        (int(route_id), user_id)
    )
    conn.commit()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True}),
    }