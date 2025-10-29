import json, sys
from urllib import request, error

def call(email, password, user_type='tenant'):
    url = 'http://localhost:8000/api/accounts/token/'
    data = json.dumps({'email': email, 'password': password, 'user_type': user_type}).encode('utf-8')
    req = request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            print('Status:', resp.status)
            print('Body:', body)
    except error.HTTPError as e:
        body = e.read().decode('utf-8')
        print('Status:', e.code)
        print('Body:', body)

if __name__ == '__main__':
    email = sys.argv[1]
    password = sys.argv[2]
    user_type = sys.argv[3] if len(sys.argv) > 3 else 'tenant'
    call(email, password, user_type)
