#!/bin/bash

# Git დამარქაფების სკრიპტი
# გამოყენება: ./backup.sh "აღწერა ჩემი ცვლილებების"

if [ $# -eq 0 ]; then
    echo "გთხოვთ მიუთითეთ კომიტის აღწერა"
    echo "მაგალითი: ./backup.sh 'გავასწორე ადმინისტრატორის ფორმა'"
    exit 1
fi

echo "🔄 ვამოწმებ ცვლილებებს..."
git status --porcelain

if [ -z "$(git status --porcelain)" ]; then
    echo "❌ ცვლილებები არ არის. არაფერია დასამარქაფებელი."
    exit 0
fi

echo "📦 ვამატებ ცვლილებებს..."
git add .

echo "💾 ვქმნი კომიტს: '$1'"
git commit -m "$1"

echo "☁️ ვატვირთავ GitHub-ზე..."
git push origin main

echo "✅ დამარქაფება დასრულდა წარმატებით!"