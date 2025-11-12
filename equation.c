#include <stdio.h>
#include <math.h>

int main() {
    double a, b, c, delta, x1, x2;

    printf("Entrez la valeur de a : ");
    scanf("%lf", &a);
    printf("Entrez la valeur de b : ");
    scanf("%lf", &b);
    printf("Entrez la valeur de c : ");
    scanf("%lf", &c);

    if (a == 0) {
        printf("Ce n'est pas une equation du second degre.\n");
    } else {
        delta = b * b - 4 * a * c;

        if (delta > 0) {
            x1 = (-b - sqrt(delta)) / (2 * a);
            x2 = (-b + sqrt(delta)) / (2 * a);
            printf("Deux solutions reelles : x1 = %.2lf et x2 = %.2lf\n", x1, x2);
        } else if (delta == 0) {
            x1 = -b / (2 * a);
            printf("Une seule solution reelle : x = %.2lf\n", x1);
        } else {
            double partieReelle = -b / (2 * a);
            double partieImaginaire = sqrt(-delta) / (2 * a);
            printf("Deux solutions complexes : x1 = %.2lf - %.2lfi et x2 = %.2lf + %.2lfi\n",
                   partieReelle, partieImaginaire, partieReelle, partieImaginaire);
        }
    }

    return 0;
}
