"""
Generate a new Django SECRET_KEY for production use.
Run this script and copy the output to your Vercel environment variables.
"""

from django.core.management.utils import get_random_secret_key

if __name__ == "__main__":
    secret_key = get_random_secret_key()
    print("\n" + "="*60)
    print("🔑 NEW DJANGO SECRET KEY FOR PRODUCTION")
    print("="*60)
    print("\nCopy this value to your Vercel environment variables:")
    print("\n" + secret_key)
    print("\n" + "="*60)
    print("\n⚠️  IMPORTANT: Keep this secret! Don't commit it to Git!")
    print("="*60 + "\n")
